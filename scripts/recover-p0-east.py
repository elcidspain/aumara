#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import math
import struct
from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np

WEST_MIN = np.array([20.0, -12.0, -8.0], dtype=np.float64)
WEST_MAX = np.array([70.0, 20.0, 16.0], dtype=np.float64)
EAST_MIN = np.array([70.0, -12.0, -8.0], dtype=np.float64)
EAST_MAX = np.array([95.0, 20.0, 16.0], dtype=np.float64)


@dataclass
class TriPoint:
    xyz: np.ndarray
    rgb: Tuple[int, int, int]
    score: float


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            b = f.read(1024 * 1024)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def decode_chunk(path: Path, minv: np.ndarray, maxv: np.ndarray) -> np.ndarray:
    raw = base64.b64decode(path.read_text().strip().encode("ascii"))
    n = (len(raw) // 9) * 9
    out = np.empty((n // 9, 6), dtype=np.float64)
    span = maxv - minv
    k = 0
    for i in range(0, n, 9):
        qx, qy, qz, r, g, b = struct.unpack("<HHHBBB", raw[i : i + 9])
        out[k, 0] = minv[0] + span[0] * qx / 65535.0
        out[k, 1] = minv[1] + span[1] * qy / 65535.0
        out[k, 2] = minv[2] + span[2] * qz / 65535.0
        out[k, 3] = r
        out[k, 4] = g
        out[k, 5] = b
        k += 1
    return out


def encode_chunk(points: np.ndarray, minv: np.ndarray, maxv: np.ndarray) -> str:
    span = maxv - minv
    out = bytearray()
    for x, y, z, r, g, b in points:
        q = np.clip(np.round((np.array([x, y, z]) - minv) / span * 65535.0), 0, 65535).astype(np.uint16)
        out.extend(struct.pack("<HHHBBB", int(q[0]), int(q[1]), int(q[2]), int(r), int(g), int(b)))
    return base64.b64encode(bytes(out)).decode("ascii")


def umeyama(src: np.ndarray, dst: np.ndarray) -> Tuple[np.ndarray, float, np.ndarray]:
    mu_s = src.mean(axis=0)
    mu_d = dst.mean(axis=0)
    x = src - mu_s
    y = dst - mu_d
    cov = (y.T @ x) / len(src)
    u, s, vt = np.linalg.svd(cov)
    r = u @ vt
    if np.linalg.det(r) < 0:
        u[:, -1] *= -1
        r = u @ vt
    var = (x**2).sum() / len(src)
    scale = float(s.sum() / var)
    t = mu_d - scale * (r @ mu_s)
    return r, scale, t


def build_candidates(flight_path: Path, flight_mp4: Path, frame_count: int, pair_window: int, orb_features: int) -> List[TriPoint]:
    flight = json.loads(flight_path.read_text())
    wps = flight["waypoints"]

    cap = cv2.VideoCapture(str(flight_mp4))
    if not cap.isOpened():
        raise RuntimeError(f"cannot open {flight_mp4}")
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    frame_ids = np.linspace(0, max(total_frames - 1, 0), frame_count).astype(int)
    frames: List[Tuple[np.ndarray, np.ndarray]] = []
    for fi in frame_ids:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(fi))
        ok, fr = cap.read()
        if ok:
            frames.append((cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY), fr))
    cap.release()

    if len(frames) < 2:
        raise RuntimeError("not enough frames decoded")

    fx = fy = 1000.0
    cx = width / 2.0
    cy = height / 2.0
    k = np.array([[fx, 0, cx], [0, fy, cy], [0, 0, 1]], dtype=np.float64)

    orb = cv2.ORB_create(nfeatures=orb_features)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING)

    feats = []
    for gray, fr in frames:
        kp, des = orb.detectAndCompute(gray, None)
        feats.append((kp, des, fr))

    poses: List[Tuple[np.ndarray, np.ndarray]] = [(np.eye(3), np.zeros((3, 1), dtype=np.float64))]
    cam_centers: List[np.ndarray] = [np.zeros(3, dtype=np.float64)]

    for i in range(len(frames) - 1):
        kp1, d1, _ = feats[i]
        kp2, d2, _ = feats[i + 1]
        if d1 is None or d2 is None:
            poses.append(poses[-1])
            cam_centers.append(cam_centers[-1])
            continue
        knn = bf.knnMatch(d1, d2, k=2)
        good = [m for m, n in knn if m.distance < 0.85 * n.distance]
        if len(good) < 50:
            poses.append(poses[-1])
            cam_centers.append(cam_centers[-1])
            continue

        p1 = np.float32([kp1[m.queryIdx].pt for m in good])
        p2 = np.float32([kp2[m.trainIdx].pt for m in good])
        e, _ = cv2.findEssentialMat(p1, p2, k, method=cv2.RANSAC, prob=0.999, threshold=3.0)
        if e is None:
            poses.append(poses[-1])
            cam_centers.append(cam_centers[-1])
            continue

        _, r_rel, t_rel, _ = cv2.recoverPose(e, p1, p2, k)

        r_prev, t_prev = poses[-1]
        wi0 = int(round(i * (len(wps) - 1) / (len(frames) - 1)))
        wi1 = int(round((i + 1) * (len(wps) - 1) / (len(frames) - 1)))
        wp0 = wps[wi0]
        wp1 = wps[wi1]
        step = float(
            np.linalg.norm(
                np.array(
                    [
                        wp1["local"]["east"] - wp0["local"]["east"],
                        wp1["local"]["north"] - wp0["local"]["north"],
                        wp1["camera_height_msl_proxy"] - wp0["camera_height_msl_proxy"],
                    ],
                    dtype=np.float64,
                )
            )
        )

        r_new = r_rel @ r_prev
        t_new = r_rel @ t_prev + t_rel * step
        poses.append((r_new, t_new))
        cam_centers.append((-r_new.T @ t_new).reshape(-1))

    tri_points: List[TriPoint] = []
    for i in range(len(frames)):
        kp1, d1, fr1 = feats[i]
        if d1 is None:
            continue
        for j in range(i + 1, min(len(frames), i + pair_window + 1)):
            kp2, d2, _ = feats[j]
            if d2 is None:
                continue
            matches = bf.match(d1, d2)
            if len(matches) < 40:
                continue
            matches = sorted(matches, key=lambda m: m.distance)[:2000]

            p1 = np.float32([kp1[m.queryIdx].pt for m in matches])
            p2 = np.float32([kp2[m.trainIdx].pt for m in matches])

            r1, t1 = poses[i]
            r2, t2 = poses[j]
            pmat1 = k @ np.hstack((r1, t1))
            pmat2 = k @ np.hstack((r2, t2))

            xh = cv2.triangulatePoints(pmat1, pmat2, p1.T, p2.T)
            xyz = (xh[:3] / xh[3]).T

            for idx, x in enumerate(xyz):
                if np.any(np.isnan(x)) or np.any(np.isinf(x)) or np.any(np.abs(x) > 1000):
                    continue
                z1 = float((r1 @ x.reshape(3, 1) + t1)[2, 0])
                z2 = float((r2 @ x.reshape(3, 1) + t2)[2, 0])
                if z1 <= 0.01 or z2 <= 0.01:
                    continue
                px = max(0, min(width - 1, int(round(p1[idx][0]))))
                py = max(0, min(height - 1, int(round(p1[idx][1]))))
                bgr = fr1[py, px]
                tri_points.append(TriPoint(xyz=x, rgb=(int(bgr[2]), int(bgr[1]), int(bgr[0])), score=float(matches[idx].distance)))

    if not tri_points:
        raise RuntimeError("triangulation produced no points")

    cam_centers_arr = np.array(cam_centers)
    wp_arr = np.array([[wp["local"]["east"], wp["local"]["north"], wp["camera_height_msl_proxy"]] for wp in wps], dtype=np.float64)
    wp_for_frames = np.array([wp_arr[int(round(i * (len(wp_arr) - 1) / (len(frames) - 1)))] for i in range(len(frames))], dtype=np.float64)
    r, s, t = umeyama(cam_centers_arr, wp_for_frames)

    out = []
    for tp in tri_points:
        aligned = (s * (r @ tp.xyz)) + t
        if not (70.0 < aligned[0] <= 95.0 and -12.0 <= aligned[1] <= 20.0 and -8.0 <= aligned[2] <= 16.0):
            continue
        out.append(TriPoint(xyz=aligned, rgb=tp.rgb, score=tp.score))

    if not out:
        raise RuntimeError("no east-envelope points from triangulation")

    return out


def voxel_dedupe(points: List[TriPoint], voxel: float) -> List[TriPoint]:
    seen = set()
    out: List[TriPoint] = []
    for p in points:
        key = tuple(np.floor((p.xyz - EAST_MIN) / voxel).astype(int).tolist())
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
    return out


def select_recovered(points: List[TriPoint], target_count: int) -> List[TriPoint]:
    arr = np.array([p.xyz for p in points])
    idx = np.arange(len(points))

    seam = idx[arr[:, 0] <= 71.2]
    mid = idx[(arr[:, 0] > 71.2) & (arr[:, 0] <= 84.0)]
    far = idx[arr[:, 0] > 84.0]

    def pick(candidates: np.ndarray, n: int) -> np.ndarray:
        if len(candidates) <= n:
            return candidates
        score = np.array([points[i].score for i in candidates], dtype=np.float64)
        xyz = arr[candidates]
        order = np.lexsort((xyz[:, 2], xyz[:, 1], xyz[:, 0], score))
        step = max(1, len(order) // n)
        return candidates[order[::step][:n]]

    sel = np.concatenate([pick(seam, 2500), pick(mid, 2200), pick(far, 1300)])
    if len(sel) > target_count:
        sel = sel[:target_count]
    if len(sel) < target_count:
        rem = np.setdiff1d(idx, sel, assume_unique=False)
        sel = np.concatenate([sel, rem[: target_count - len(sel)]])
    return [points[i] for i in sel]


def np_points(tri: List[TriPoint]) -> np.ndarray:
    out = np.empty((len(tri), 6), dtype=np.float64)
    for i, p in enumerate(tri):
        out[i, 0:3] = p.xyz
        out[i, 3:] = p.rgb
    return out


def nearest_metrics(source: np.ndarray, target: np.ndarray) -> dict:
    vals = []
    target_xyz = target[:, :3]
    for p in source[:, :3]:
        vals.append(float(np.linalg.norm(target_xyz - p, axis=1).min()))
    vals = np.array(vals)
    return {
        "samples": int(len(vals)),
        "mean_nn_m": float(vals.mean()),
        "p95_nn_m": float(np.percentile(vals, 95)),
        "max_nn_m": float(vals.max()),
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="Deterministic east P0 recovery from authoritative AUMARA media")
    ap.add_argument("--repo", default=".")
    ap.add_argument("--frame-count", type=int, default=42)
    ap.add_argument("--pair-window", type=int, default=5)
    ap.add_argument("--orb-features", type=int, default=4500)
    ap.add_argument("--voxel", type=float, default=0.05)
    args = ap.parse_args()

    repo = Path(args.repo).resolve()
    proof = repo / "public" / "v3-3-proof"

    west_files = [proof / f"p0-points-{i}.b64" for i in range(19)]
    west_hashes_before = {p.name: sha256_file(p) for p in west_files}

    flight_mp4 = repo / "public" / "media" / "flight" / "flight.mp4"
    flight_path = repo / "public" / "spatial" / "world" / "flight-path.json"

    cands = build_candidates(flight_path, flight_mp4, args.frame_count, args.pair_window, args.orb_features)
    cands = voxel_dedupe(cands, args.voxel)
    recovered = select_recovered(cands, 6000)
    recovered_np = np_points(recovered)

    # Write recovered chunks only (1..3). Survivors 0/4 remain untouched.
    for i in range(3):
        sub = recovered_np[i * 2000 : (i + 1) * 2000]
        (proof / f"p0-east-{i+1}.b64").write_text(encode_chunk(sub, EAST_MIN, EAST_MAX))

    west = np.vstack([decode_chunk(p, WEST_MIN, WEST_MAX) for p in west_files])
    east0 = decode_chunk(proof / "p0-east-0.b64", EAST_MIN, EAST_MAX)
    east1 = decode_chunk(proof / "p0-east-1.b64", EAST_MIN, EAST_MAX)
    east2 = decode_chunk(proof / "p0-east-2.b64", EAST_MIN, EAST_MAX)
    east3 = decode_chunk(proof / "p0-east-3.b64", EAST_MIN, EAST_MAX)
    east4 = decode_chunk(proof / "p0-east-4.b64", EAST_MIN, EAST_MAX)
    east = np.vstack([east0, east1, east2, east3, east4])
    combined = np.vstack([west, east])

    west_band_69_70 = west[(west[:, 0] >= 69.0) & (west[:, 0] <= 70.0)]
    east_band_70_71 = east[(east[:, 0] >= 70.0) & (east[:, 0] <= 71.0)]
    west_band_68_69 = west[(west[:, 0] >= 68.0) & (west[:, 0] <= 69.0)]

    seam_nn = nearest_metrics(west_band_69_70, east_band_70_71)
    baseline_nn = nearest_metrics(west_band_68_69, west_band_69_70)

    seam_ratio = {
        "mean_ratio": seam_nn["mean_nn_m"] / baseline_nn["mean_nn_m"],
        "p95_ratio": seam_nn["p95_nn_m"] / baseline_nn["p95_nn_m"],
    }

    # Strict machine-QA seam gate: seam density should not exceed adjacent west internal density.
    seam_gate = {"max_mean_ratio": 1.0, "max_p95_ratio": 1.0}
    integration_pass = bool(
        seam_ratio["mean_ratio"] <= seam_gate["max_mean_ratio"]
        and seam_ratio["p95_ratio"] <= seam_gate["max_p95_ratio"]
    )

    houses = {h["id"]: h for h in json.loads((proof / "houses_af.json").read_text())}

    def house_support(hid: str, radius: float = 3.8) -> dict:
        h = houses[hid]
        d = np.hypot(combined[:, 0] - h["east"], combined[:, 1] - h["north"])
        near = combined[d <= radius]
        return {
            "house": hid,
            "radius_m": radius,
            "points": int(len(near)),
            "z_min": float(near[:, 2].min()) if len(near) else None,
            "z_max": float(near[:, 2].max()) if len(near) else None,
            "z_span": float(near[:, 2].max() - near[:, 2].min()) if len(near) else None,
        }

    west_hashes_after = {p.name: sha256_file(p) for p in west_files}
    west_unchanged = west_hashes_before == west_hashes_after

    command = (
        f"python scripts/recover-p0-east.py --repo {repo} --frame-count {args.frame_count} "
        f"--pair-window {args.pair_window} --orb-features {args.orb_features} --voxel {args.voxel}"
    )

    qa = {
        "schema": "aumara.v3-3.p0-east-recovery-qa",
        "method": "deterministic media-derived SfM: ORB + essential-matrix/recoverPose + multi-pair triangulation + camera-center Umeyama alignment; no procedural infill/interpolation",
        "inputs": {
            "flight_mp4": "public/media/flight/flight.mp4",
            "flight_mp4_sha256": sha256_file(flight_mp4),
            "flight_path": "public/spatial/world/flight-path.json",
            "flight_path_sha256": sha256_file(flight_path),
            "surviving_chunks": {
                "p0-east-0.b64": {"sha256": sha256_file(proof / "p0-east-0.b64")},
                "p0-east-4.b64": {"sha256": sha256_file(proof / "p0-east-4.b64")},
            },
            "west_chunks_sha256": west_hashes_after,
        },
        "command": command,
        "parameters": {
            "frame_count": args.frame_count,
            "pair_window": args.pair_window,
            "orb_features": args.orb_features,
            "voxel": args.voxel,
            "east_bbox": {"x": [70, 95], "y": [-12, 20], "z": [-8, 16]},
        },
        "counts": {
            "west_preserved_points": int(len(west)),
            "east_survivor_nominal_points": 3080,
            "east_survivor_decoded_points": int(len(east0) + len(east4)),
            "east_recovered_points": 6000,
            "east_total_nominal_points": 9080,
            "east_total_decoded_points": int(len(east)),
            "combined_nominal_points": 46884,
            "combined_decoded_points": int(len(combined)),
        },
        "bounds": {
            "west": {"min": west[:, :3].min(axis=0).round(6).tolist(), "max": west[:, :3].max(axis=0).round(6).tolist()},
            "east": {"min": east[:, :3].min(axis=0).round(6).tolist(), "max": east[:, :3].max(axis=0).round(6).tolist()},
            "combined": {"min": combined[:, :3].min(axis=0).round(6).tolist(), "max": combined[:, :3].max(axis=0).round(6).tolist()},
        },
        "seam_x70": {
            "west_band": [69.0, 70.0],
            "east_band": [70.0, 71.0],
            "west_band_points": int(len(west_band_69_70)),
            "east_band_points": int(len(east_band_70_71)),
            "west_to_east_nn": seam_nn,
            "west_internal_adjacent_baseline": {
                "source_band": [68.0, 69.0],
                "target_band": [69.0, 70.0],
                **baseline_nn,
            },
            "ratio_vs_baseline": seam_ratio,
            "pass_gate": seam_gate,
        },
        "ef_support": [house_support("E"), house_support("F")],
        "west_chunks_byte_identical": west_unchanged,
        "integration_pass": integration_pass,
        "status": "SEAM_CONTINUOUS" if integration_pass else "SEAM_PENDING_ALIGNMENT",
        "recovered_chunks": [
            {"file": "p0-east-1.b64", "points": 2000, "bytes": 18000, "b64_len": 24000, "sha256": sha256_file(proof / "p0-east-1.b64")},
            {"file": "p0-east-2.b64", "points": 2000, "bytes": 18000, "b64_len": 24000, "sha256": sha256_file(proof / "p0-east-2.b64")},
            {"file": "p0-east-3.b64", "points": 2000, "bytes": 18000, "b64_len": 24000, "sha256": sha256_file(proof / "p0-east-3.b64")},
        ],
    }
    (proof / "p0_east_recovery_qa.json").write_text(json.dumps(qa, indent=2) + "\n")

    ext = json.loads((proof / "p0_east_extension.json").read_text())
    ext["east_source_method"] = "deterministic media-derived SfM (ORB+E/recoverPose+triangulation), no procedural infill"
    ext["recovery_command"] = command
    ext["recovery_parameters"] = qa["parameters"]
    ext["chunks_surviving"] = [
        {"file": "p0-east-0.b64", "nominal_points": 2000, "decoded_points": int(len(east0)), "sha256": sha256_file(proof / "p0-east-0.b64")},
        {"file": "p0-east-4.b64", "nominal_points": 1080, "decoded_points": int(len(east4)), "sha256": sha256_file(proof / "p0-east-4.b64")},
    ]
    ext["chunks_recovered"] = qa["recovered_chunks"]
    ext["chunks_all"] = ext["chunks_surviving"][:1] + ext["chunks_recovered"] + ext["chunks_surviving"][1:]
    ext["west_chunks_sha256"] = west_hashes_after
    ext["west_chunks_byte_identical"] = west_unchanged
    ext["east_working_points"] = 9080
    ext["seam_ratio_vs_baseline"] = seam_ratio
    ext["seam_pass_gate"] = seam_gate
    ext["pass"] = integration_pass
    ext["qa_gate"] = (
        "PASS: seam continuity within baseline ratio and west hashes locked"
        if integration_pass
        else "HOLD: seam ratio above threshold; keep integration_pass=false"
    )
    (proof / "p0_east_extension.json").write_text(json.dumps(ext, indent=2) + "\n")

    hy = json.loads((proof / "p0_hybrid.json").read_text())
    hy["east_extension_alignment_joined"] = integration_pass
    hy["status"] = (
        "OWNER_QA · east extension staged and machine-QA seam PASS"
        if integration_pass
        else "OWNER_QA · east extension staged, seam alignment join pending"
    )
    (proof / "p0_hybrid.json").write_text(json.dumps(hy, indent=2) + "\n")

    prov = {
        "schema": "aumara.v3-3.p0-east-recovery-provenance",
        "script": "scripts/recover-p0-east.py",
        "command": command,
        "source_files": qa["inputs"],
        "no_synthetic_geometry": True,
        "notes": [
            "Recovered chunks 1..3 are generated only from authoritative flight media bytes and canonical flight-path anchors.",
            "No DEM backfill, no random point generation, no interpolation-based infill was used in this script.",
            "West chunk files are hash-checked before and after recovery to prove byte identity lock.",
        ],
    }
    (proof / "p0_east_recovery_provenance.json").write_text(json.dumps(prov, indent=2) + "\n")

    print(json.dumps({
        "integration_pass": integration_pass,
        "seam_mean": seam_ratio["mean_ratio"],
        "seam_p95": seam_ratio["p95_ratio"],
        "west_unchanged": west_unchanged,
        "decoded_survivor_points": int(len(east0) + len(east4)),
    }, indent=2))


if __name__ == "__main__":
    cv2.setNumThreads(1)
    main()

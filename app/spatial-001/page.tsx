import styles from "./spatial.module.css";

const coverage = [
  ["Multi-house cluster 02 / 04 / 08", "PARTIAL", "2 unique stills"],
  ["DAY_WALK / entrance", "PARTIAL", "MASTER_C · 8.00 s"],
  ["Parcel overview", "SINGLE_VIEW_ONLY", "08 only"],
  ["House A–F exteriors", "IDENTITY_UNRESOLVED", "capture identity missing"],
  ["1B6A8852 / 1B6A9875", "INTERIORS", "not exterior evidence"],
] as const;

const captureNext = [
  "Third still of the 02/04 cluster at a 15–30° offset.",
  "Three overlapping exterior views per house A–F, unlabelled, GPS on.",
  "Extend MASTER_C from 8 seconds to 20–30 seconds.",
  "Second parcel overview beside viewpoint 08.",
] as const;

const runtimeAcceptance = [
  "Google context survives Earth → parcel approach.",
  "Google tiles hidden before WP0 on mobile low-altitude envelope.",
  "Local V2.1 twin authoritative for WP0 → WP27.",
  "A–F labels remain hidden until handoff completes.",
  "No fatal render error; no gray Google photogrammetry shards during local flight.",
] as const;

export default function Spatial001Page() {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>AUMARA · SPATIAL CONTROL</p>
          <h1>GPT-20260905-SPATIAL-001</h1>
          <p className={styles.subtitle}>GROK COORDINATION / CAPTURE AUDIT</p>
        </div>
        <div className={styles.statusStack}>
          <span className={`${styles.pill} ${styles.danger}`}>CAPTURE_GAP_IDENTIFIED</span>
          <span className={`${styles.pill} ${styles.neutral}`}>READ-ONLY OPS SURFACE</span>
        </div>
      </header>

      <section className={styles.heroGrid}>
        <article className={`${styles.card} ${styles.primaryCard}`}>
          <p className={styles.kicker}>Mission</p>
          <h2>One spatial world. Two execution lanes.</h2>
          <p>
            The canonical AUMARA runtime remains in <code>elcidspain/elcidspain.github.io/aumara</code>.
            This surface coordinates evidence and execution only; it does not redefine georeference,
            A–F positions, GLB geometry, flight-path, guest copy, DNS, or booking wiring.
          </p>
          <div className={styles.signalRow}>
            <div><strong>GPT</strong><span>lead / architecture / QA</span></div>
            <div><strong>Grok</strong><span>build executor</span></div>
            <div><strong>Imagine</strong><span>not geometry truth</span></div>
          </div>
        </article>

        <article className={styles.card}>
          <p className={styles.kicker}>Truth lock</p>
          <dl className={styles.metrics}>
            <div><dt>Foundry V1</dt><dd>SOURCE_SAFE · CONTENT_FX only</dd></div>
            <div><dt>Foundry V2</dt><dd>HOLD</dd></div>
            <div><dt>Foundry V3</dt><dd>REJECT</dd></div>
            <div><dt>MASTER_C</dt><dd>8.00 s · checksum MATCH</dd></div>
          </dl>
        </article>
      </section>

      <section className={styles.lanes}>
        <article className={`${styles.card} ${styles.laneCard}`}>
          <div className={styles.laneHead}>
            <div>
              <p className={styles.kicker}>Lane 01 · Runtime</p>
              <h2>GO — handoff patch only</h2>
            </div>
            <span className={`${styles.pill} ${styles.go}`}>EXECUTE</span>
          </div>
          <p className={styles.muted}>
            Active Grok job: <code>AUMARA_CLEAN_LOCAL_HANDOFF_GROK</code>. Keep the proven Earth-to-parcel descent,
            then hand off cleanly to the accepted V2.1 local twin before WP0.
          </p>
          <ol className={styles.checkList}>
            {runtimeAcceptance.map((item) => <li key={item}>{item}</li>)}
          </ol>
          <div className={styles.freeze}>
            <strong>Freeze:</strong> landing copy/CSS, V2.1 GLB geometry, georeference, A–F coordinates,
            Booking wiring, Ion credential path.
          </div>
        </article>

        <article className={`${styles.card} ${styles.laneCard}`}>
          <div className={styles.laneHead}>
            <div>
              <p className={styles.kicker}>Lane 02 · Capture</p>
              <h2>NO-GO — source gap open</h2>
            </div>
            <span className={`${styles.pill} ${styles.danger}`}>BLOCKED</span>
          </div>
          <p className={styles.muted}>
            Two-view diagnostics are useful for evidence, not site truth. The 02↔04 pair confirms only two unique
            stills. A third camera station is still missing; A–F exterior identity remains unresolved.
          </p>
          <ol className={styles.checkList}>
            {captureNext.map((item) => <li key={item}>{item}</li>)}
          </ol>
          <div className={styles.freeze}>
            <strong>Gate:</strong> collect source evidence first. Do not use Grok Imagine to invent unseen geometry.
          </div>
        </article>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>Coverage matrix</p>
            <h2>What the audit actually supports</h2>
          </div>
          <span className={styles.smallNote}>Independent verify: OpenCV 5.0.0 · no COLMAP</span>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>Zone</th><th>Status</th><th>Evidence</th></tr></thead>
            <tbody>
              {coverage.map(([zone, status, evidence]) => (
                <tr key={zone}>
                  <td>{zone}</td>
                  <td><span className={styles.tableStatus}>{status}</span></td>
                  <td>{evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.grid3}>
        <article className={styles.card}>
          <p className={styles.kicker}>Geometry evidence</p>
          <h3>02 ↔ 04</h3>
          <div className={styles.bigNumber}>63</div>
          <p className={styles.muted}>inliers · 0.759 verified · two unique stills</p>
        </article>
        <article className={styles.card}>
          <p className={styles.kicker}>Walk baseline</p>
          <h3>MASTER_C kf_03 ↔ kf_05</h3>
          <div className={styles.bigNumber}>269</div>
          <p className={styles.muted}>inliers · 0.84 · short 8 s baseline</p>
        </article>
        <article className={styles.card}>
          <p className={styles.kicker}>Diagnostic only</p>
          <h3>Triangulation</h3>
          <div className={styles.bigNumber}>47</div>
          <p className={styles.muted}>points in independent verify · arbitrary scale · not site truth</p>
        </article>
      </section>

      <section className={`${styles.card} ${styles.commandCard}`}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>Grok execution packet</p>
            <h2>Exact next coordination rule</h2>
          </div>
          <span className={`${styles.pill} ${styles.go}`}>GPT → GROK</span>
        </div>
        <pre>{`READ canonical AUMARA control plane + active job first.

RUNTIME LANE:
PATCH CURRENT RUNTIME ONLY.
Solve Google context → clean local handoff → local WP0–WP27.
Do not reopen geometry or landing design.
Return actual mobile + desktop runtime evidence and receipt.

CAPTURE LANE:
Treat AUMARA_CAPTURE_AUDIT_001_COVERAGE as evidence truth.
Do not use Imagine as geometry truth.
Do not promote two-view triangulation to site truth.
Wait for / ingest the four missing capture items, then re-run source verification.

STOP CONDITIONS:
No invented A–F identity. No invented camera station. No parallel coordinate system.
No DNS/domain changes. No fake live status.`}</pre>
      </section>

      <footer className={styles.footer}>
        <div>
          <strong>AUMARA spatial coordination</strong>
          <span>Operational report · 05 Sep 2026</span>
        </div>
        <div className={styles.footerLinks}>
          <a href="https://github.com/elcidspain/elcidspain.github.io/blob/main/aumara/PROJECT.md" target="_blank" rel="noreferrer">Canonical project</a>
          <a href="https://github.com/elcidspain/elcidspain.github.io/blob/main/aumara/jobs/AUMARA_CLEAN_LOCAL_HANDOFF_GROK.json" target="_blank" rel="noreferrer">Active Grok job</a>
        </div>
      </footer>
    </main>
  );
}

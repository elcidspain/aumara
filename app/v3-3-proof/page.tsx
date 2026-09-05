"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./proof.module.css";

type P = { x:number; y:number; z:number; r:number; g:number; b:number };
type V3 = { x:number; y:number; z:number };

const MIN = [31.9075,-7.6396,-2.0199];
const MAX = [50.8017,9.4134,7.5616];
const WPS: V3[] = [
  {x:23.254,y:-1.155,z:4.467},{x:26.698,y:-2.496,z:4.524},{x:30.143,y:-3.838,z:4.536},
  {x:33.647,y:-4.810,z:4.500},{x:37.325,y:-4.526,z:4.423},{x:40.931,y:-3.715,z:4.304},
  {x:44.538,y:-2.904,z:4.144},{x:48.144,y:-2.092,z:3.961},{x:51.799,y:-1.635,z:3.775},
  {x:54.780,y:-0.116,z:3.618},{x:56.995,y:2.843,z:3.475}
];
const HOUSES = [
  {id:"A",x:35.254,y:0.845,z:0.505,d:7},
  {id:"B",x:52.215,y:4.961,z:-0.046,d:9},
  {id:"C",x:63.556,y:13.969,z:-0.241,d:7}
];

function decodePoints(b64:string): P[] {
  const raw = atob(b64.trim());
  const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  const pts:P[] = [];
  for (let i=0;i+8<bytes.length;i+=9) {
    const qx=view.getUint16(i,true), qy=view.getUint16(i+2,true), qz=view.getUint16(i+4,true);
    pts.push({
      x:MIN[0]+(MAX[0]-MIN[0])*qx/65535,
      y:MIN[1]+(MAX[1]-MIN[1])*qy/65535,
      z:MIN[2]+(MAX[2]-MIN[2])*qz/65535,
      r:bytes[i+6],g:bytes[i+7],b:bytes[i+8]
    });
  }
  return pts;
}

export default function V33Proof() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points,setPoints] = useState<P[]>([]);
  const [yaw,setYaw] = useState(-0.72);
  const [pitch,setPitch] = useState(0.34);
  const [zoom,setZoom] = useState(1);
  const [auto,setAuto] = useState(true);
  const drag = useRef<{x:number;y:number;yaw:number;pitch:number}|null>(null);

  useEffect(()=>{
    fetch("/v3-3-proof/points.b64").then(r=>r.text()).then(t=>setPoints(decodePoints(t)));
  },[]);

  const centre = useMemo(()=>({x:40.5,y:0,z:2.2}),[]);

  useEffect(()=>{
    if (!auto) return;
    let raf=0, last=performance.now();
    const tick=(now:number)=>{ const dt=Math.min(40,now-last); last=now; setYaw(v=>v+dt*0.00011); raf=requestAnimationFrame(tick); };
    raf=requestAnimationFrame(tick); return()=>cancelAnimationFrame(raf);
  },[auto]);

  useEffect(()=>{
    const c=canvasRef.current; if(!c) return;
    const ctx=c.getContext("2d"); if(!ctx) return;
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const w=c.clientWidth,h=c.clientHeight;
    if(c.width!==Math.floor(w*dpr)||c.height!==Math.floor(h*dpr)){c.width=Math.floor(w*dpr);c.height=Math.floor(h*dpr)}
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const scale=Math.min(w/48,h/30)*zoom;
    const project=(p:V3)=>{
      const x=p.x-centre.x,y=p.y-centre.y,z=p.z-centre.z;
      const rx=cy*x-sy*y, ry=sy*x+cy*y;
      const yy=cp*ry-sp*z, zz=sp*ry+cp*z;
      return {sx:w/2+rx*scale,sy:h/2-yy*scale,depth:zz};
    };

    ctx.strokeStyle="rgba(196,154,100,.08)";ctx.lineWidth=1;
    for(let gx=20;gx<=65;gx+=5){ const a=project({x:gx,y:-15,z:0}),b=project({x:gx,y:20,z:0});ctx.beginPath();ctx.moveTo(a.sx,a.sy);ctx.lineTo(b.sx,b.sy);ctx.stroke(); }
    for(let gy=-15;gy<=20;gy+=5){ const a=project({x:20,y:gy,z:0}),b=project({x:65,y:gy,z:0});ctx.beginPath();ctx.moveTo(a.sx,a.sy);ctx.lineTo(b.sx,b.sy);ctx.stroke(); }

    const drawn=points.map(p=>({p,s:project(p)})).sort((a,b)=>a.s.depth-b.s.depth);
    for(const {p,s} of drawn){
      if(s.sx<-8||s.sx>w+8||s.sy<-8||s.sy>h+8) continue;
      ctx.fillStyle=`rgb(${p.r},${p.g},${p.b})`;
      const rad=Math.max(1.2,2.4*zoom);
      ctx.beginPath();ctx.arc(s.sx,s.sy,rad,0,Math.PI*2);ctx.fill();
    }

    ctx.strokeStyle="#d8ae76";ctx.lineWidth=3;ctx.shadowColor="rgba(216,174,118,.45)";ctx.shadowBlur=8;
    ctx.beginPath();WPS.forEach((p,i)=>{const s=project(p);i?ctx.lineTo(s.sx,s.sy):ctx.moveTo(s.sx,s.sy)});ctx.stroke();ctx.shadowBlur=0;
    [0,5,10].forEach(i=>{const s=project(WPS[i]);ctx.fillStyle="#f4dfbd";ctx.beginPath();ctx.arc(s.sx,s.sy,4,0,Math.PI*2);ctx.fill();ctx.font="600 11px ui-monospace,monospace";ctx.fillText(`WP${i}`,s.sx+7,s.sy-7)});

    ctx.strokeStyle="rgba(104,215,156,.9)";ctx.fillStyle="rgba(104,215,156,.08)";ctx.lineWidth=2;
    for(const hse of HOUSES){
      const ring:V3[]=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI*2;ring.push({x:hse.x+Math.cos(a)*hse.d/2,y:hse.y+Math.sin(a)*hse.d/2,z:hse.z})}
      ctx.beginPath();ring.forEach((p,i)=>{const s=project(p);i?ctx.lineTo(s.sx,s.sy):ctx.moveTo(s.sx,s.sy)});ctx.closePath();ctx.fill();ctx.stroke();
      const s=project({x:hse.x,y:hse.y,z:hse.z+1});ctx.fillStyle="#8fe4b2";ctx.font="700 13px system-ui";ctx.fillText(hse.id,s.sx+5,s.sy-5);ctx.fillStyle="rgba(104,215,156,.08)";
    }
  },[points,yaw,pitch,zoom,centre]);

  const down=(e:React.PointerEvent)=>{setAuto(false);drag.current={x:e.clientX,y:e.clientY,yaw,pitch};(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)};
  const move=(e:React.PointerEvent)=>{if(!drag.current)return;setYaw(drag.current.yaw+(e.clientX-drag.current.x)*0.008);setPitch(Math.max(-.8,Math.min(1.05,drag.current.pitch+(e.clientY-drag.current.y)*0.006)))};
  const up=()=>{drag.current=null};

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><div className={styles.kicker}>AUMARA · V3.3 SOURCE RECONSTRUCTION</div><h1>Actual geometry from MASTER_C</h1><p>Not a status page. This is a live spatial proof built from pixels in the real AUMARA day-walk video.</p></div>
      <span className={styles.badge}>SANDBOX · OWNER QA</span>
    </header>

    <section className={styles.stageCard}>
      <div className={styles.stageTop}><div><strong>{points.length||"…"}</strong><span>visible RGB source points</span></div><div className={styles.legend}><span className={styles.dotSource}/>source geometry <span className={styles.dotRoute}/>WP0–WP10 <span className={styles.dotHouse}/>A/B/C canonical footprints</div></div>
      <canvas ref={canvasRef} className={styles.canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}/>
      <div className={styles.controls}><button onClick={()=>setZoom(v=>Math.max(.55,v-.15))}>−</button><button onClick={()=>{setYaw(-.72);setPitch(.34);setZoom(1);setAuto(false)}}>RESET</button><button onClick={()=>setAuto(v=>!v)}>{auto?"PAUSE":"ORBIT"}</button><button onClick={()=>setZoom(v=>Math.min(2.1,v+.15))}>+</button></div>
      <div className={styles.hint}>Drag to rotate · zoom with − / +</div>
    </section>

    <section className={styles.metrics}>
      <article><span>SOURCE</span><strong>MASTER_C · 8.00 s</strong><p>Outdoor path, stone edge, vegetation and multiple house exteriors.</p></article>
      <article><span>RECON RUN</span><strong>11,248 RGB points</strong><p>SIFT / essential-matrix pose recovery + optical-flow triangulation. No photo cards. No interior pixels.</p></article>
      <article><span>REGISTRATION</span><strong>WP0 → WP10 sandbox alignment</strong><p>Similarity-normalized for this proof. It is not yet a survey-grade registration.</p></article>
    </section>

    <section className={styles.note}><strong>What you are looking at:</strong> colored points are triangulated from the real video; the gold line is the canonical guest route; green rings are canonical A/B/C footprint envelopes only. This is the first real-geometry proof, not the finished full-site twin.</section>
  </main>
}

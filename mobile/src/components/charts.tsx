import { useEffect, useId, useRef, useState } from "react";

type Pt = [number, number];

/** Smooth cubic path through points (cardinal spline), clamped so it never dips below the baseline. */
function smooth(pts: Pt[], top: number, bottom: number) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : "";
  const clamp = (y: number) => Math.min(bottom, Math.max(top, y));
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2, t = 0.2;
    d += ` C${p1[0] + (p2[0] - p0[0]) * t},${clamp(p1[1] + (p2[1] - p0[1]) * t)} ${p2[0] - (p3[0] - p1[0]) * t},${clamp(p2[1] - (p3[1] - p1[1]) * t)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Interactive area chart: touch or drag to read any day's value. */
export function AreaChart({ data, height = 168, color = "#0f766d", format }: { data: { label: string; value: number }[]; height?: number; color?: string; format: (n: number) => string }) {
  const id = useId().replace(/:/g, "");
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(320);
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(200, el.clientWidth))); ro.observe(el); setW(Math.max(200, el.clientWidth));
    return () => ro.disconnect();
  }, []);
  const n = data.length, L = 6, R = 6, T = 16, B = 24, innerW = w - L - R, innerH = height - T - B;
  const max = Math.max(1, ...data.map(d => d.value)) * 1.12;
  const x = (i: number) => L + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const y = (v: number) => T + (1 - v / max) * innerH;
  const pts: Pt[] = data.map((d, i) => [x(i), y(d.value)]);
  const line = smooth(pts, T, T + innerH);
  const area = pts.length > 1 ? `${line} L${x(n - 1)},${T + innerH} L${x(0)},${T + innerH} Z` : "";
  const shown = active ?? n - 1;
  const labelIdx = n <= 5 ? data.map((_, i) => i) : [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1];
  const pick = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setActive(Math.min(n - 1, Math.max(0, Math.round(((clientX - r.left - L) / Math.max(1, innerW)) * (n - 1)))));
  };
  if (!n) return null;
  const tipLeft = Math.min(w - 78, Math.max(78, x(shown)));
  return (
    <div ref={box} className="chart" style={{ height }} onPointerDown={e => pick(e.clientX)} onPointerMove={e => (e.buttons || e.pointerType === "touch") && pick(e.clientX)} onPointerLeave={() => setActive(null)} onPointerUp={() => setTimeout(() => setActive(null), 1400)}>
      <svg width={w} height={height} role="img" aria-label="Sales trend">
        <defs><linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {[0, 0.5, 1].map(f => <line key={f} x1={L} x2={w - R} y1={T + innerH * f} y2={T + innerH * f} stroke="#e8edf3" strokeDasharray={f === 1 ? undefined : "3 5"} />)}
        {area && <path d={area} fill={`url(#g${id})`} />}
        <path d={line} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={x(shown)} x2={x(shown)} y1={T} y2={T + innerH} stroke={color} strokeOpacity=".25" strokeDasharray="3 4" />
        <circle cx={x(shown)} cy={y(data[shown].value)} r="9" fill={color} fillOpacity=".16" />
        <circle cx={x(shown)} cy={y(data[shown].value)} r="4.5" fill="#fff" stroke={color} strokeWidth="2.6" />
        {labelIdx.map(i => <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize="10.5" fill="#94a3b8" fontWeight="600">{data[i].label}</text>)}
      </svg>
      <div className="chart-tip" style={{ left: tipLeft, top: Math.max(0, y(data[shown].value) - 50) }}><b>{format(data[shown].value)}</b><span>{data[shown].label}</span></div>
    </div>
  );
}

/** Tiny trend line with no axes, used inside the hero card. */
export function Sparkline({ values, className = "" }: { values: number[]; className?: string }) {
  const id = useId().replace(/:/g, "");
  if (values.length < 2) return null;
  const max = Math.max(1, ...values), W = 100, H = 36;
  const pts: Pt[] = values.map((v, i) => [(i * W) / (values.length - 1), H - 3 - (v / max) * (H - 8)]);
  const line = smooth(pts, 2, H - 2);
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5eead4" stopOpacity=".35" /><stop offset="1" stopColor="#5eead4" stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#s${id})`} />
      <path d={line} fill="none" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

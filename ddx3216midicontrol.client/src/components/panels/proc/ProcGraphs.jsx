import { useMemo } from "react";
import {
  BAND_COLORS,
  compressorOut,
  eqFreqHz,
  eqGainDb,
  eqQ,
  eqShape,
  gateOut,
  hpFreqHz,
  responseCurve,
} from "../../../functions/ProcCurves";


const W = 600;
const H = 180;
const DB_RANGE = 18;
const xOfF = (f) => (Math.log10(f / 20) / 3) * W;
const yOfDb = (db) => H / 2 - (Math.max(-DB_RANGE - 6, Math.min(DB_RANGE + 6, db)) / DB_RANGE) * (H / 2 - 8);

/**
 * values: snapshot keyed by EQ def keys (eqOn, eq1FilterType, eq1Freq, ...)
 * bands:  [{ n, typeDef }] to resolve the filter type labels
 */
export function EqGraph({ values, bands }) {
  const { path, fill, markers } = useMemo(() => {
    const filters = bands.map(({ n, typeDef }) => ({
      n,
      shape: typeDef ? eqShape(typeDef.labels?.[values[`eq${n}FilterType`]]) : "peak",
      f: eqFreqHz(values[`eq${n}Freq`]),
      gain: eqGainDb(values[`eq${n}Gain`]),
      q: eqQ(values[`eq${n}Q`]),
    }));
    const active = [...filters];
    if (values.highPassOn) {
      active.push({ shape: "highpass", f: hpFreqHz(values.highPassFreq), gain: 0, q: Math.SQRT1_2 });
    }
    const pts = responseCurve(active);
    const d = pts
      .map((p, i) => `${i ? "L" : "M"}${xOfF(p.f).toFixed(1)},${yOfDb(p.db).toFixed(1)}`)
      .join(" ");
    return {
      path: d,
      fill: `${d} L${W},${H / 2} L0,${H / 2} Z`,
      markers: filters.map((f) => ({
        n: f.n,
        x: xOfF(Math.min(Math.max(f.f, 20), 20000)),
        y: yOfDb(f.shape === "lowpass" || f.shape === "highpass" ? 0 : f.gain),
      })),
    };
  }, [values, bands]);

  const on = Boolean(values.eqOn);

  // The SVG stretches to the box (curve + grid); dots and labels are HTML
  // overlays positioned in % so they stay round / readable at any size.
  const pct = (x, y) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

  return (
    <div
      className={`proc-graph eq-graph${on ? "" : " off"}`}
      role="img"
      aria-label="EQ frequency response"
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {[100, 1000, 10000].map((f) => (
          <line key={f} className="grid" x1={xOfF(f)} x2={xOfF(f)} y1={0} y2={H} />
        ))}
        {[-12, -6, 6, 12].map((db) => (
          <line key={db} className="grid" x1={0} x2={W} y1={yOfDb(db)} y2={yOfDb(db)} />
        ))}
        <line className="grid zero" x1={0} x2={W} y1={H / 2} y2={H / 2} />
        <path className="curve-fill" d={fill} />
        <path className="curve" d={path} />
      </svg>
      {[100, 1000, 10000].map((f) => (
        <span key={f} className="graph-label x" style={pct(xOfF(f), H)}>
          {f >= 1000 ? `${f / 1000}k` : f}
        </span>
      ))}
      <span className="graph-label y" style={pct(0, yOfDb(12))}>+12</span>
      <span className="graph-label y" style={pct(0, yOfDb(-12))}>-12</span>
      {markers.map((m) => (
        <span
          key={m.n}
          className="band-dot"
          style={{ ...pct(m.x, m.y), background: BAND_COLORS[m.n] }}
        />
      ))}
    </div>
  );
}

const DW = 160;
const DMIN = -80;

/** Static transfer curve for compressor ("comp") or gate ("gate") */
export function DynamicsGraph({ mode, on, threshold, ratio = 1, knee = 0, makeup = 0, range = 0 }) {
  const path = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const x = DMIN + (i / 64) * -DMIN;
      const y = mode === "gate" ? gateOut(x, threshold, range) : compressorOut(x, threshold, ratio, knee, makeup);
      pts.push([((x - DMIN) / -DMIN) * DW, DW - ((Math.max(DMIN, Math.min(0, y)) - DMIN) / -DMIN) * DW]);
    }
    return pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  }, [mode, threshold, ratio, knee, makeup, range]);

  const tx = ((threshold - DMIN) / -DMIN) * DW;

  return (
    <svg
      className={`proc-graph dyn-graph${on ? "" : " off"}`}
      viewBox={`0 0 ${DW} ${DW}`}
      role="img"
      aria-label={mode === "gate" ? "Gate curve" : "Compressor curve"}
    >
      {[0.25, 0.5, 0.75].map((r) => (
        <g key={r}>
          <line className="grid" x1={r * DW} x2={r * DW} y1={0} y2={DW} />
          <line className="grid" x1={0} x2={DW} y1={r * DW} y2={r * DW} />
        </g>
      ))}
      <line className="grid unity" x1={0} y1={DW} x2={DW} y2={0} />
      <line className="threshold" x1={tx} x2={tx} y1={0} y2={DW} />
      <path className="curve" d={path} />
    </svg>
  );
}

// Display-only math for the processing graphs (EQ response, dynamics curves).
// Raw -> real conversions mirror the `format` functions in ddxParamDefinition.*.

const FS = 48000;

export const BAND_COLORS = ["#f08c00", "#2fb344", "#3d8bfd", "#ae3ec9"];

export const eqFreqHz = (raw) => 20 * Math.pow(1000, raw / 159);
export const eqGainDb = (raw) => -18 + raw / 2;
export const eqQ = (raw) => 0.1 * Math.pow(100, raw / 40);
export const hpFreqHz = (raw) => 4 * Math.pow(100, raw / 80);

// filter type label -> response shape
export function eqShape(label) {
  const l = String(label ?? "").toLowerCase();
  if (l === "hc") return "lowpass";
  if (l === "lc") return "highpass";
  if (l === "hsh") return "highshelf";
  if (l === "lsh") return "lowshelf";
  return "peak";
}

// RBJ audio-EQ-cookbook biquad coefficients
function biquad(shape, f, gainDb, q) {
  const w0 = (2 * Math.PI * Math.min(f, FS * 0.49)) / FS;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const A = Math.pow(10, gainDb / 40);
  const Q = Math.max(q, 0.1);
  let alpha = sin / (2 * Q);
  switch (shape) {
    case "lowpass":
      return [(1 - cos) / 2, 1 - cos, (1 - cos) / 2, 1 + alpha, -2 * cos, 1 - alpha];
    case "highpass":
      return [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2, 1 + alpha, -2 * cos, 1 - alpha];
    case "highshelf":
    case "lowshelf": {
      alpha = (sin / 2) * Math.SQRT2; // shelf slope S = 1
      const s = 2 * Math.sqrt(A) * alpha;
      return shape === "highshelf"
        ? [
            A * (A + 1 + (A - 1) * cos + s),
            -2 * A * (A - 1 + (A + 1) * cos),
            A * (A + 1 + (A - 1) * cos - s),
            A + 1 - (A - 1) * cos + s,
            2 * (A - 1 - (A + 1) * cos),
            A + 1 - (A - 1) * cos - s,
          ]
        : [
            A * (A + 1 - (A - 1) * cos + s),
            2 * A * (A - 1 - (A + 1) * cos),
            A * (A + 1 - (A - 1) * cos - s),
            A + 1 + (A - 1) * cos + s,
            -2 * (A - 1 + (A + 1) * cos),
            A + 1 + (A - 1) * cos - s,
          ];
    }
    default:
      return [1 + alpha * A, -2 * cos, 1 - alpha * A, 1 + alpha / A, -2 * cos, 1 - alpha / A];
  }
}

function magnitudeDb([b0, b1, b2, a0, a1, a2], f) {
  const w = (2 * Math.PI * f) / FS;
  const c1 = Math.cos(w), s1 = Math.sin(w);
  const c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
  const nr = b0 + b1 * c1 + b2 * c2, ni = -(b1 * s1 + b2 * s2);
  const dr = a0 + a1 * c1 + a2 * c2, di = -(a1 * s1 + a2 * s2);
  const mag = Math.sqrt((nr * nr + ni * ni) / (dr * dr + di * di));
  return 20 * Math.log10(Math.max(mag, 1e-6));
}

/** filters: [{ shape, f, gain, q }] -> [{ f, db }] over 20 Hz..20 kHz */
export function responseCurve(filters, points = 160) {
  const coefs = filters.map((x) => biquad(x.shape, x.f, x.gain, x.q));
  const out = [];
  for (let i = 0; i < points; i++) {
    const f = 20 * Math.pow(1000, i / (points - 1));
    let db = 0;
    for (const c of coefs) db += magnitudeDb(c, f);
    out.push({ f, db });
  }
  return out;
}

/** Compressor static curve: input dB -> output dB */
export function compressorOut(inDb, thr, ratio, kneeDb, makeup) {
  const over = inDb - thr;
  let out;
  if (kneeDb > 0 && Math.abs(over) <= kneeDb / 2) {
    out = inDb + ((1 / ratio - 1) * Math.pow(over + kneeDb / 2, 2)) / (2 * kneeDb);
  } else if (over > 0) {
    out = thr + over / ratio;
  } else {
    out = inDb;
  }
  return out + makeup;
}

/** Gate static curve: below threshold the signal drops by `range` dB */
export function gateOut(inDb, thr, rangeDb) {
  return inDb < thr ? inDb - rangeDb : inDb;
}

import { clamp } from "../router/MidiControl";

// 9 intervals (10 breakpoints) for norm and dB
export const N_BREAKS = [0, 6, 12, 25, 37, 50, 62.5, 75, 87.5, 100];
export const DB_BREAKS = [-80, -60, -48, -36, -24, -12, -6, 0, 6, 12];

// "Log scale" shape inside each interval.
// base > 1. Higher = more "loggy". base=10 is a good default.
function logEase(t, base = 10) {
  // t in [0,1] -> [0,1]
  // f(t)=log_base(1+(base-1)*t)
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return Math.log(1 + (base - 1) * t) / Math.log(base);
}

function logEaseInv(u, base = 10) {
  // inverse of logEase: u in [0,1] -> t in [0,1]
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  return (Math.pow(base, u) - 1) / (base - 1);
}

function findSegmentByNorm(norm) {
  // returns i such that norm in [N_BREAKS[i], N_BREAKS[i+1]]
  for (let i = 0; i < N_BREAKS.length - 1; i++) {
    const a = N_BREAKS[i],
      b = N_BREAKS[i + 1];
    if (norm <= b) return i;
  }
  return N_BREAKS.length - 2;
}

function findSegmentByDb(db) {
  // monotonic increasing, so scan the dB breakpoints similarly
  for (let i = 0; i < DB_BREAKS.length - 1; i++) {
    const a = DB_BREAKS[i],
      b = DB_BREAKS[i + 1];
    if (db <= b) return i;
  }
  return DB_BREAKS.length - 2;
}

export function normToDb(norm, minDb = -80, maxDb = 12, curveBase = 10) {
  norm = clamp(norm, 0, 100);

  // snap extremes
  if (norm <= 0) return minDb;
  if (norm >= 100) return maxDb;

  const i = findSegmentByNorm(norm);

  const n0 = N_BREAKS[i],
    n1 = N_BREAKS[i + 1];
  const db0 = DB_BREAKS[i],
    db1 = DB_BREAKS[i + 1];

  const tLin = (norm - n0) / (n1 - n0); // 0..1
  const t = logEase(tLin, curveBase); // log-shaped 0..1

  return db0 + (db1 - db0) * t;
}

export function dbToNorm(db, minDb = -80, maxDb = 12, curveBase = 10) {
  db = clamp(db, minDb, maxDb);

  // snap extremes
  if (db <= minDb) return 0;
  if (db >= maxDb) return 100;

  const i = findSegmentByDb(db);

  const db0 = DB_BREAKS[i],
    db1 = DB_BREAKS[i + 1];
  const n0 = N_BREAKS[i],
    n1 = N_BREAKS[i + 1];

  const uLin = (db - db0) / (db1 - db0); // 0..1
  const tLin = logEaseInv(uLin, curveBase); // inverse log shape

  return n0 + (n1 - n0) * tLin;
}

export function dbToValue14(db) {
  const num = parseDb(db);
  if (!Number.isFinite(num)) return 80;
  const v = Math.round((num + 75) * 16 + 80);
  return clamp(v, 80, 1472);
}

export function value14ToDb(value14) {
  const v = clamp(value14, 80, 1472);
  return (v - 80) / 16 - 75;
}

export function parseDb(db) {
  if (typeof db === "number") return db;
  if (typeof db !== "string") return NaN;
  return parseFloat(db.trim().replace(",", "."));
}

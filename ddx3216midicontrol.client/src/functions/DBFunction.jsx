import { clamp } from "./ChannelFunction";

// DDX3216 fader raw value: 0..1472, linear in dB (raw / 16 - 80) => -80..+12 dB
export const RAW_MIN = 0;
export const RAW_MAX = 1472;
const DB_MIN = -80;
const DB_MAX = 12;
export const RAW_UNITY = (0 - DB_MIN) * 16; // 0 dB = 1280

// Console-style taper: dB -> fader position (0 = bottom, 1 = top).
// Piecewise linear between breakpoints so 0 dB sits at ~3/4 of the travel and
// the useful -30..+10 range gets most of the throw (like a real console).
const TAPER = [
  [-80, 0],
  [-60, 0.05],
  [-50, 0.1],
  [-40, 0.17],
  [-30, 0.26],
  [-20, 0.4],
  [-10, 0.57],
  [-5, 0.67],
  [0, 0.77],
  [5, 0.87],
  [10, 0.96],
  [12, 1],
];

// dB values that get a label on the fader scale
export const SCALE_MARKS = [10, 5, 0, -5, -10, -20, -30, -40, -60, -80];

export function rawToDb(raw) {
  return DB_MIN + clamp(raw, RAW_MIN, RAW_MAX) / 16;
}

export function dbToRaw(db) {
  return Math.round((clamp(db, DB_MIN, DB_MAX) - DB_MIN) * 16);
}

export function dbToPos(db) {
  db = clamp(db, DB_MIN, DB_MAX);
  for (let i = 0; i < TAPER.length - 1; i++) {
    const [d0, p0] = TAPER[i];
    const [d1, p1] = TAPER[i + 1];
    if (db <= d1) return p0 + ((db - d0) / (d1 - d0)) * (p1 - p0);
  }
  return 1;
}

function posToDb(pos) {
  pos = clamp(pos, 0, 1);
  for (let i = 0; i < TAPER.length - 1; i++) {
    const [d0, p0] = TAPER[i];
    const [d1, p1] = TAPER[i + 1];
    if (pos <= p1) return d0 + ((pos - p0) / (p1 - p0)) * (d1 - d0);
  }
  return DB_MAX;
}

export const rawToPos = (raw) => dbToPos(rawToDb(raw));
export const posToRaw = (pos) => dbToRaw(posToDb(pos));

export function formatDb(raw) {
  if (raw === undefined || raw === null || Number.isNaN(Number(raw))) return "—";
  if (raw <= RAW_MIN) return "-∞";
  const db = rawToDb(raw);
  return `${db > 0 ? "+" : ""}${db.toFixed(1)}`;
}

/** Display text for a raw parameter value, tolerant of partial definitions. */
export function formatParam(def, raw) {
  if (raw === undefined || raw === null || Number.isNaN(Number(raw))) return "—";
  try {
    if (def.format) {
      const out = def.format(raw, def);
      if (out !== undefined && out !== null && out !== "undefined") return String(out);
    }
  } catch {
    /* fall through to labels / raw */
  }
  return String(def.labels?.[raw] ?? raw);
}

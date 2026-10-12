/** Frequency for display: "47.0 Hz", "447 Hz", "1.41 kHz", "10.0 kHz". */
export function fmtHz(hz) {
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz >= 10000 ? 1 : 2)} kHz`;
  return `${hz.toFixed(hz < 100 ? 1 : 0)} Hz`;
}

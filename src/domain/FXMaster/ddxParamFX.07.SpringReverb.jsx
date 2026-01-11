export const FX_SPRING_REVERB = {
  type: 7,
  name: "Spring Reverb",

  params: [
    {
      index: 1, // FX param 1 (91)
      label: "Decay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 36,
      defaultRaw: 0,
      format: (v) => {
        // 2 – 5 s, logarithmic
        const sec = 2 * Math.pow(5 / 2, v / 36);
        return `${sec.toFixed(2)} s`;
      },
    },
    {
      index: 2, // 92
      label: "HiDec Damp",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 3, // 93
      label: "HiDec Freq",
      kind: ParamKind.RANGE,
      min: 0,
      max: 106,
      defaultRaw: 0,
      format: (v) => {
        // 0.2 – 20 kHz, logarithmic
        const khz = 0.2 * Math.pow(100, v / 106);
        return `${khz.toFixed(2)} kHz`;
      },
    },
    {
      index: 4, // 94
      label: "Stereo Width",
      kind: ParamKind.RANGE,
      min: 0,
      max: 20,
      defaultRaw: 0,
      format: (v) => String(v),
    },
    {
      index: 5, // 95
      label: "PreDelay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 138,
      defaultRaw: 0,
      format: (v) => {
        // 0 – 490 ms, logarithmic
        const ms = 490 * Math.pow(v / 138, 2);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 6, // 96
      label: "Metal Resonance",
      kind: ParamKind.RANGE,
      min: 0,
      max: 20,
      defaultRaw: 0,
      format: (v) => String(v),
    },
    {
      index: 7, // 97
      label: "Hi-Shv Freq",
      kind: ParamKind.RANGE,
      min: 0,
      max: 68,
      defaultRaw: 0,
      format: (v) => {
        // 1 – 20 kHz, logarithmic
        const khz = 1 * Math.pow(20, v / 68);
        return `${khz.toFixed(2)} kHz`;
      },
    },
    {
      index: 8, // 98
      label: "Hi-Shv Damp",
      kind: ParamKind.RANGE,
      min: 0,
      max: 30,
      defaultRaw: 0,
      format: (v) => `${v} dB`,
    },
  ],
};

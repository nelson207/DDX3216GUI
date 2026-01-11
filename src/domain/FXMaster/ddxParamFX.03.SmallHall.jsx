export const FX_SMALL_HALL = {
  type: 3,
  name: "Small Hall",

  params: [
    {
      index: 1, // FX param 1 (91)
      label: "Decay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 34,
      defaultRaw: 0,
      format: (v) => {
        // 0.5 – 1.2 s, logarithmic
        const sec = 0.5 * Math.pow(1.2 / 0.5, v / 34);
        return `${sec.toFixed(2)} s`;
      },
    },
    {
      index: 2, // 92
      label: "Damping",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 3, // 93
      label: "Bass Multiply",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 50,
      format: (v) => `${v - 50}`,
    },
    {
      index: 4, // 94
      label: "Reverb Modulation",
      kind: ParamKind.RANGE,
      min: 0,
      max: 49,
      defaultRaw: 0,
      format: (v) => `${1 + v}`,
    },
    {
      index: 5, // 95
      label: "PreDelay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 76,
      defaultRaw: 0,
      format: (v) => {
        // 0 – 100 ms, logarithmic
        const ms = 100 * Math.pow(v / 76, 2);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 6, // 96
      label: "Diffusion",
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
      max: 53,
      defaultRaw: 0,
      format: (v) => {
        // 1 – 10 kHz, logarithmic
        const khz = 1 * Math.pow(10, v / 53);
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

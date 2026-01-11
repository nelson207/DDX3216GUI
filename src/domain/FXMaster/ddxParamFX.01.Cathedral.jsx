export const FX_CATHEDRAL = {
  type: 1,
  name: "Cathedral",

  params: [
    {
      index: 1, // FX param 1 (91)
      label: "Decay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 89,
      defaultRaw: 0,
      format: (v) => {
        // 2–20 s, logarithmic
        const sec = 2 * Math.pow(10, v / 89);
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
      max: 139,
      defaultRaw: 0,
      format: (v) => {
        // 0–490 ms, logarithmic
        const ms = 490 * Math.pow(v / 139, 2);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 6, // 96
      label: "Density",
      kind: ParamKind.RANGE,
      min: 0,
      max: 50,
      defaultRaw: 0,
      format: (v) => String(v),
    },
    {
      index: 7, // 97
      label: "Diffusion",
      kind: ParamKind.RANGE,
      min: 0,
      max: 20,
      defaultRaw: 0,
      format: (v) => String(v),
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

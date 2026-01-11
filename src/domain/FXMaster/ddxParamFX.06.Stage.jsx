export const FX_STAGE = {
  type: 6,
  name: "Stage",

  params: [
    {
      index: 1, // FX param 1 (91)
      label: "Decay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 89,
      defaultRaw: 0,
      format: (v) => {
        // 2 – 20 s, logarithmic
        const sec = 2 * Math.pow(10, v / 89);
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
      label: "ER/Rev Balance",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 50,
      format: (v) => `${v}%`,
    },
    {
      index: 4, // 94
      label: "Size",
      kind: ParamKind.RANGE,
      min: 1,
      max: 49,
      defaultRaw: 1,
      format: (v) => `${v}`, // 1 – 50
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
      label: "Rev Delay",
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
      label: "Stereo Width",
      kind: ParamKind.RANGE,
      min: 0,
      max: 20,
      defaultRaw: 0,
      format: (v) => String(v),
    },
  ],
};

export const FX_GATED_REVERB = {
  type: 8,
  name: "Gated Reverb",

  params: [
    {
      index: 1, // 91
      label: "Decay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 90,
      defaultRaw: 0,
      format: (v) => {
        // 1 – 10 s, log
        const sec = 1 * Math.pow(10 / 1, v / 90);
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
      label: "Diffusion",
      kind: ParamKind.RANGE,
      min: 0,
      max: 20,
      defaultRaw: 0,
      format: (v) => String(v),
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
        // 0 – 490 ms, log
        const ms = 490 * Math.pow(v / 138, 2);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 6, // 96
      label: "Gate Threshold",
      kind: ParamKind.RANGE,
      min: 0,
      max: 60,
      defaultRaw: 60,
      format: (v) => `${-60 + v} dB`,
    },
    {
      index: 7, // 97
      label: "Gate Hold",
      kind: ParamKind.RANGE,
      min: 0,
      max: 156,
      defaultRaw: 0,
      format: (v) => {
        // 10 – 1000 ms, log
        const ms = 10 * Math.pow(100, v / 156);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 8, // 98
      label: "Gate Resp",
      kind: ParamKind.RANGE,
      min: 0,
      max: 101,
      defaultRaw: 0,
      format: (v) => {
        // 2 – 200 ms, log
        const ms = 2 * Math.pow(100, v / 101);
        return `${ms.toFixed(1)} ms`;
      },
    },
  ],
};

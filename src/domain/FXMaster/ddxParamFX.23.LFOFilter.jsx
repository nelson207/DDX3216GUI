export const FX_LFO_FILTER = {
  type: 23,
  name: "LFO Filter",

  params: [
    {
      index: 1, // 91
      label: "Speed",
      kind: ParamKind.RANGE,
      min: 0,
      max: 105,
      defaultRaw: 0,
      format: (v) => {
        // 0.05 – 40 Hz, log
        const hz = 0.05 * Math.pow(40 / 0.05, v / 105);
        return `${hz.toFixed(3)} Hz`;
      },
    },
    {
      index: 2, // 92
      label: "Wave",
      kind: ParamKind.ENUM,
      values: [0, 1, 2],
      labels: {
        0: "Sine",
        1: "Tri",
        2: "Square",
      },
      defaultRaw: 0,
      format: (v, def) => def.labels[v],
    },
    {
      index: 3, // 93
      label: "Base Freq",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => {
        // 100 Hz – 10 kHz, log
        const hz = 100 * Math.pow(100, v / 100);
        return `${hz.toFixed(1)} Hz`;
      },
    },
    {
      index: 4, // 94
      label: "Depth",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 6, // 96
      label: "Slewing",
      kind: ParamKind.RANGE,
      min: 0,
      max: 48,
      defaultRaw: 0,
      format: (v) => {
        // 1 – 50 ms, log
        const ms = 1 * Math.pow(50 / 1, v / 48);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 7, // 97
      label: "Filter Mode",
      kind: ParamKind.ENUM,
      values: [0, 1, 2],
      labels: {
        0: "HP",
        1: "BP",
        2: "LP",
      },
      defaultRaw: 2,
      format: (v, def) => def.labels[v],
    },
    {
      index: 8, // 98
      label: "Filter Q",
      kind: ParamKind.RANGE,
      min: 0,
      max: 49,
      defaultRaw: 0,
      format: (v) => {
        // 1 – 20, log
        const q = 1 * Math.pow(20 / 1, v / 49);
        return `Q ${q.toFixed(2)}`;
      },
    },
  ],
};

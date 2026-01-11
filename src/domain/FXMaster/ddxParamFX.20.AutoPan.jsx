export const FX_AUTOPAN = {
  type: 20,
  name: "Autopan",

  params: [
    {
      index: 1, // 91
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
      index: 2, // 92
      label: "Speed",
      kind: ParamKind.RANGE,
      min: 0,
      max: 94,
      defaultRaw: 0,
      format: (v) => {
        // 0.05 – 20 Hz, log
        const hz = 0.05 * Math.pow(20 / 0.05, v / 94);
        return `${hz.toFixed(3)} Hz`;
      },
    },
    {
      index: 3, // 93
      label: "Depth",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    // 94–98 unused
  ],
};

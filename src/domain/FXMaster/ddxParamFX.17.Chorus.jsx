export const FX_CHORUS = {
  type: 17,
  name: "Chorus",

  params: [
    {
      index: 1, // 91
      label: "Wave",
      kind: ParamKind.ENUM,
      values: [0, 1],
      labels: {
        0: "Tri",
        1: "Sine",
      },
      defaultRaw: 0,
      format: (v, def) => def.labels[v],
    },
    {
      index: 2, // 92
      label: "LFO Speed",
      kind: ParamKind.RANGE,
      min: 0,
      max: 94,
      defaultRaw: 0,
      format: (v) => {
        // 0.05 – 20 kHz, log (as shown in your page)
        const khz = 0.05 * Math.pow(20 / 0.05, v / 94);
        return `${khz.toFixed(3)} kHz`;
      },
    },
    {
      index: 3, // 93
      label: "Mod Depth",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 4, // 94
      label: "Mod Delay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 99,
      defaultRaw: 0,
      format: (v) => {
        // 5 – 100 ms, log
        const ms = 5 * Math.pow(100 / 5, v / 99);
        return `${ms.toFixed(1)} ms`;
      },
    },
    // 95–98 unused
  ],
};

export const FX_FLANGER = {
  type: 16,
  name: "Flanger",

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
        // 0.05 – 20 Hz, log
        const hz = 0.05 * Math.pow(20 / 0.05, v / 94);
        return `${hz.toFixed(3)} Hz`;
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
        // 0.5 – 50 ms, log
        const ms = 0.5 * Math.pow(50 / 0.5, v / 99);
        return `${ms.toFixed(2)} ms`;
      },
    },
    {
      index: 5, // 95
      label: "Feedback",
      kind: ParamKind.RANGE,
      min: 0,
      max: 198,
      defaultRaw: 99,
      format: (v) => `${v - 99}%`, // -99 … +99 %
    },
    {
      index: 6, // 96
      label: "Feed LP",
      kind: ParamKind.RANGE,
      min: 0,
      max: 106,
      defaultRaw: 0,
      format: (v) => {
        // 0.2 – 20 kHz, log
        const khz = 0.2 * Math.pow(100, v / 106);
        return `${khz.toFixed(2)} kHz`;
      },
    },
    // 97–98 unused
  ],
};

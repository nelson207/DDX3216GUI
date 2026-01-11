export const FX_ECHO = {
  type: 10,
  name: "Echo",

  params: [
    {
      index: 1, // 91
      label: "Delay L",
      kind: ParamKind.RANGE,
      min: 0,
      max: 1800,
      defaultRaw: 0,
      format: (v) => `${v} ms`,
    },
    {
      index: 2, // 92
      label: "Delay R",
      kind: ParamKind.RANGE,
      min: 0,
      max: 1800,
      defaultRaw: 0,
      format: (v) => `${v} ms`,
    },
    {
      index: 3, // 93
      label: "Feedback Delay L",
      kind: ParamKind.RANGE,
      min: 0,
      max: 162,
      defaultRaw: 0,
      format: (v) => {
        // 0 – 900 ms, log
        const ms = 900 * Math.pow(v / 162, 2);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 4, // 94
      label: "Feedback Delay R",
      kind: ParamKind.RANGE,
      min: 0,
      max: 162,
      defaultRaw: 0,
      format: (v) => {
        // 0 – 900 ms, log
        const ms = 900 * Math.pow(v / 162, 2);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 5, // 95
      label: "Feedback HP",
      kind: ParamKind.RANGE,
      min: 0,
      max: 144,
      defaultRaw: 0,
      format: (v) => {
        // 20 Hz – 10 kHz, log
        const hz = 20 * Math.pow(500, v / 144);
        return `${hz.toFixed(1)} Hz`;
      },
    },
    {
      index: 6, // 96
      label: "Feedback LP",
      kind: ParamKind.RANGE,
      min: 0,
      max: 122,
      defaultRaw: 0,
      format: (v) => {
        // 100 Hz – 20 kHz, log
        const hz = 100 * Math.pow(200, v / 122);
        return `${hz.toFixed(1)} Hz`;
      },
    },
    {
      index: 7, // 97
      label: "Feedback",
      kind: ParamKind.RANGE,
      min: 0,
      max: 99,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 8, // 98
      label: "Input Gain R",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 100,
      format: (v) => `${v}%`,
    },
  ],
};

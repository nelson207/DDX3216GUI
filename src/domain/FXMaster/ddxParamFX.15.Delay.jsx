export const FX_DELAY = {
  type: 15,
  name: "Delay",

  params: [
    {
      index: 1, // 91
      label: "Delay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 1800,
      defaultRaw: 0,
      format: (v) => `${v} ms`,
    },
    {
      index: 2, // 92
      label: "Feedback",
      kind: ParamKind.RANGE,
      min: 0,
      max: 99,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 3, // 93
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
      index: 4, // 94
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
    // 95–98 unused
  ],
};

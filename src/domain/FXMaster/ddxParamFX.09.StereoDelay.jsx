export const FX_STEREO_DELAY = {
  type: 9,
  name: "Stereo Delay",

  params: [
    {
      index: 1, // FX param 1 (91)
      label: "Delay L",
      kind: ParamKind.RANGE,
      min: 0,
      max: 2700,
      defaultRaw: 0,
      format: (v) => `${v} ms`,
    },
    {
      index: 2, // 92
      label: "Delay R",
      kind: ParamKind.RANGE,
      min: 0,
      max: 2700,
      defaultRaw: 0,
      format: (v) => `${v} ms`,
    },
    {
      index: 3, // 93
      label: "Feedback L",
      kind: ParamKind.RANGE,
      min: 0,
      max: 99,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 4, // 94
      label: "Feedback R",
      kind: ParamKind.RANGE,
      min: 0,
      max: 99,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 5, // 95
      label: "Feedback HP",
      kind: ParamKind.RANGE,
      min: 0,
      max: 144,
      defaultRaw: 0,
      format: (v) => {
        // 20 Hz – 10 kHz, logarithmic
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
        // 100 Hz – 20 kHz, logarithmic
        const hz = 100 * Math.pow(200, v / 122);
        return `${hz.toFixed(1)} Hz`;
      },
    },
    // FX params 97–98 are unused for this algorithm
  ],
};

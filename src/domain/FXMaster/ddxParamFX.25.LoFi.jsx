export const FX_LOFI = {
  type: 25,
  name: "LoFi",

  params: [
    {
      index: 1, // 91
      label: "Bits",
      kind: ParamKind.RANGE,
      min: 0,
      max: 6,
      defaultRaw: 6,
      format: (v) => {
        // 6 – 16 bits, log-ish mapping per manual
        const bits = Math.round(6 * Math.pow(16 / 6, v / 6));
        return `${bits} bit`;
      },
    },
    {
      index: 2, // 92
      label: "Noise Gain",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 3, // 93
      label: "Noise HP",
      kind: ParamKind.RANGE,
      min: 0,
      max: 154,
      defaultRaw: 0,
      format: (v) => {
        // 20 Hz – 16 kHz, log
        const hz = 20 * Math.pow(800, v / 154);
        return `${hz.toFixed(1)} Hz`;
      },
    },
    {
      index: 4, // 94
      label: "Noise LP",
      kind: ParamKind.RANGE,
      min: 0,
      max: 106,
      defaultRaw: 106,
      format: (v) => {
        // 0.2 – 20 kHz, log
        const khz = 0.2 * Math.pow(100, v / 106);
        return `${khz.toFixed(2)} kHz`;
      },
    },
    {
      index: 5, // 95
      label: "Signal HP",
      kind: ParamKind.RANGE,
      min: 0,
      max: 154,
      defaultRaw: 0,
      format: (v) => {
        // 20 Hz – 16 kHz, log
        const hz = 20 * Math.pow(800, v / 154);
        return `${hz.toFixed(1)} Hz`;
      },
    },
    {
      index: 6, // 96
      label: "Signal LP",
      kind: ParamKind.RANGE,
      min: 0,
      max: 121,
      defaultRaw: 121,
      format: (v) => {
        // 0.1 – 20 kHz, log
        const khz = 0.1 * Math.pow(200, v / 121);
        return `${khz.toFixed(2)} kHz`;
      },
    },
    {
      index: 7, // 97
      label: "Buzz Gain",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 8, // 98
      label: "Buzz Freq",
      kind: ParamKind.ENUM,
      values: [0, 1],
      labels: {
        0: "50 Hz",
        1: "60 Hz",
      },
      defaultRaw: 0,
      format: (v, def) => def.labels[v],
    },
  ],
};

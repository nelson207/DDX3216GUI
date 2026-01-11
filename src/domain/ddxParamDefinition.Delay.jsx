export const DELAY_PARAMS = [
  {
    id: 60,
    key: "delayOn",
    label: "Channel Delay On",
    kind: ParamKind.SWITCH,
    defaultRaw: 0,
    format: (v) => (v ? "On" : "Off"),
  },
  {
    id: 61,
    key: "delayPhase",
    label: "Delay Phase",
    kind: ParamKind.ENUM,
    values: [0, 1],
    labels: {
      0: "Normal",
      1: "Invert",
    },
    defaultRaw: 0,
    format: (v, def) => def.labels[v],
  },
  {
    id: 62,
    key: "delayTime",
    label: "Delay Time",
    kind: ParamKind.RANGE,
    min: 0,
    max: 115,
    defaultRaw: 0,
    format: (v) => {
      const samples = v * v;
      return `${samples} samples`;
    },
  },
  {
    id: 63,
    key: "delayFeedback",
    label: "Delay Feedback",
    kind: ParamKind.RANGE,
    min: 0,
    max: 180,
    defaultRaw: 90,
    format: (v) => `${-90 + v}%`,
  },
  {
    id: 64,
    key: "delayMix",
    label: "Delay Mix",
    kind: ParamKind.RANGE,
    min: 0,
    max: 100,
    defaultRaw: 0,
    format: (v) => `${v}%`,
  },
];

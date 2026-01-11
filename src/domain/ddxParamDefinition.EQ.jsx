export const EQ_PARAMS = [
  {
    id: 20,
    key: "eqOn",
    label: "EQ on",
    kind: "switch",
    defaultRaw: 0,
    format: (v) => (v ? "On" : "Off"),
  },
  {
    id: 21,
    key: "eq1FilterType",
    label: "EQ band 1 Filter type",
    kind: "enum",
    values: [0, 1, 2],
    labels: { 0: "param", 1: "HC", 2: "HSh" },
    defaultRaw: 0,
    format: (v, def) => def.labels?.[v] ?? String(v),
  },
  {
    id: 22,
    key: "eq1Freq",
    label: "EQ band 1 Frequency",
    kind: "range",
    min: 0,
    max: 159,
    defaultRaw: 0,
    format: (v) => {
      const hz = 20 * Math.pow(1000, v / 159);
      return `${hz.toFixed(1)} Hz`;
    },
  },
  {
    id: 23,
    key: "eq1Gain",
    label: "EQ band 1 Gain",
    kind: "range",
    min: 0,
    max: 72,
    defaultRaw: 36,
    format: (v) => `${(-18 + v / 2).toFixed(1)} dB`,
  },
  {
    id: 24,
    key: "eq1Q",
    label: "EQ band 1 Q",
    kind: "range",
    min: 0,
    max: 40,
    defaultRaw: 0,
    format: (v) => {
      const q = 0.1 * Math.pow(100, v / 40);
      return `Q ${q.toFixed(2)}`;
    },
  },
  {
    id: 25,
    key: "eq2FilterType",
    label: "EQ band 2 Filter type",
    kind: "enum",
    values: [0, 1, 2],
    labels: { 0: "param", 1: "HC", 2: "HSh" },
    defaultRaw: 0,
    format: (v, def) => def.labels?.[v] ?? String(v),
  },
  {
    id: 26,
    key: "eq2Freq",
    label: "EQ band 2 Frequency",
    kind: "range",
    min: 0,
    max: 159,
    defaultRaw: 0,
    format: (v) => {
      const hz = 20 * Math.pow(1000, v / 159);
      return `${hz.toFixed(1)} Hz`;
    },
  },
  {
    id: 27,
    key: "eq2Gain",
    label: "EQ band 2 Gain",
    kind: "range",
    min: 0,
    max: 72,
    defaultRaw: 36,
    format: (v) => `${(-18 + v / 2).toFixed(1)} dB`,
  },
  {
    id: 28,
    key: "eq2Q",
    label: "EQ band 2 Q",
    kind: "range",
    min: 0,
    max: 40,
    defaultRaw: 0,
    format: (v) => {
      const q = 0.1 * Math.pow(100, v / 40);
      return `Q ${q.toFixed(2)}`;
    },
  },
  {
    id: 29,
    key: "eq3FilterType",
    label: "EQ band 3 Filter type",
    kind: "enum",
    values: [0, 1, 2],
    labels: { 0: "param", 1: "HC", 2: "HSh" },
    defaultRaw: 0,
    format: (v, def) => def.labels?.[v] ?? String(v),
  },
  {
    id: 30,
    key: "eq3Freq",
    label: "EQ band 3 Frequency",
    kind: "range",
    min: 0,
    max: 159,
    defaultRaw: 0,
    format: (v) => {
      const hz = 20 * Math.pow(1000, v / 159);
      return `${hz.toFixed(1)} Hz`;
    },
  },
  {
    id: 31,
    key: "eq3Gain",
    label: "EQ band 3 Gain",
    kind: "range",
    min: 0,
    max: 72,
    defaultRaw: 36,
    format: (v) => `${(-18 + v / 2).toFixed(1)} dB`,
  },
  {
    id: 32,
    key: "eq3Q",
    label: "EQ band 3 Q",
    kind: "range",
    min: 0,
    max: 40,
    defaultRaw: 0,
    format: (v) => {
      const q = 0.1 * Math.pow(100, v / 40);
      return `Q ${q.toFixed(2)}`;
    },
  },
  {
    id: 33,
    key: "eq4FilterType",
    label: "EQ band 4 Filter type",
    kind: "enum",
    values: [0, 1, 2],
    labels: { 0: "param", 1: "HC", 2: "HSh" },
    defaultRaw: 0,
    format: (v, def) => def.labels?.[v] ?? String(v),
  },
  {
    id: 34,
    key: "eq4Freq",
    label: "EQ band 4 Frequency",
    kind: "range",
    min: 0,
    max: 159,
    defaultRaw: 0,
    format: (v) => {
      const hz = 20 * Math.pow(1000, v / 159);
      return `${hz.toFixed(1)} Hz`;
    },
  },
  {
    id: 35,
    key: "eq4Gain",
    label: "EQ band 4 Gain",
    kind: "range",
    min: 0,
    max: 72,
    defaultRaw: 36,
    format: (v) => `${(-18 + v / 2).toFixed(1)} dB`,
  },
  {
    id: 36,
    key: "eq4Q",
    label: "EQ band 4 Q",
    kind: "range",
    min: 0,
    max: 40,
    defaultRaw: 0,
    format: (v) => {
      const q = 0.1 * Math.pow(100, v / 40);
      return `Q ${q.toFixed(2)}`;
    },
  },
  {
    id: 37,
    key: "highPassOn",
    label: "High Pass on",
    kind: "switch",
    defaultRaw: 0, // 0/1 (or use true/false if you prefer)
    format: (v) => (v ? "On" : "Off"),
  },
  {
    id: 38,
    key: "highPassFreq",
    label: "High Pass Frequency",
    kind: "range",
    min: 0,
    max: 80,
    defaultRaw: 0,
    format: (v) => {
      const q = 4 * Math.pow(100, v / 80);
      return `Q ${q.toFixed(2)}`;
    },
  },
];

export const BASE_PARAMS = [
  {
    id: 1,
    key: "volume",
    label: "Volume",
    kind: "range",
    min: 0,
    max: 1472,
    defaultRaw: 0,
    format: (v) => `${(-80 + v / 16).toFixed(1)} dB`,
  },
  {
    id: 2,
    key: "mute",
    label: "Mute",
    kind: "switch",
    defaultRaw: 0, // 0/1 (or use true/false if you prefer)
    format: (v) => (v ? "On" : "Off"),
  },
  {
    id: 3,
    key: "pan",
    label: "Pan",
    kind: "range",
    min: 0,
    max: 60,
    defaultRaw: 30,
    format: (v) => `${(-30 + v).toFixed(0)} dB`,
  },
  {
    id: 4,
    key: "rtToMain",
    label: "Route to Main",
    kind: "switch",
    defaultRaw: 0, // 0/1 (or use true/false if you prefer)
    format: (v) => (v ? "On" : "Off"),
  },
  {
    id: 5,
    key: "rtToBus",
    label: "Route to Bus",
    kind: "switch",
    defaultRaw: 0, // 0/1 (or use true/false if you prefer)
    format: (v) => (v ? "On" : "Off"),
  },
  {
    id: 6,
    key: "busVolume",
    label: "Bus Volume",
    kind: "range",
    min: 0,
    max: 1472,
    defaultRaw: 0,
    format: (v) => `${(-80 + v / 16).toFixed(1)} dB`,
  },
  {
    id: 6,
    key: "busVolumePrePost",
    label: "Bus Volume Pre/Post",
    kind: "switch",
    defaultRaw: 0, // 0/1 (or use true/false if you prefer)
    format: (v) => (v ? "Pre" : "Post"),
  },
  {
    id: 8,
    key: "busPan",
    label: "Bus Pan",
    kind: "range",
    min: 0,
    max: 60,
    defaultRaw: 30,
    format: (v) => `${(-30 + v).toFixed(0)} dB`,
  },
  {
    id: 9,
    key: "busPanFollowChannel",
    label: "Bus Pan Follow Channel",
    kind: "switch",
    defaultRaw: 0, // 0/1 (or use true/false if you prefer)
    format: (v) => (v ? "On" : "Off"),
  },
];

import { ParamKind } from "./ddxParamKind";

export const BASE_PARAMS = [
  {
    id: 1,
    key: "volume",
    label: (v) => `${v === 64 ? "Main" : "Ch " + v}`,
    kind: ParamKind.RANGE,
    min: 0,
    max: 1472,
    defaultRaw: 0,
    format: (v) => `${(-80 + v / 16).toFixed(1)} dB`,
  },
  {
    id: 2,
    key: "mute",
    label: "Mute",
    kind: ParamKind.SWITCH,
    defaultRaw: 0, // 0/1 (or use true/false if you prefer)
    classSelected: "btn-danger",
    format: (v) => (v ? "Mute" : "Mute"),
  },
  {
    id: 3,
    key: "pan",
    label: "Pan",
    kind: ParamKind.RANGE,
    min: 0,
    max: 60,
    defaultRaw: 30,
    format: (v) => {
      if (v === 30) return "Center";

      if (v < 30) {
        // 0–29 → 0–30 L
        const val = 30 - v;
        return `${val} L`;
      }

      // 31–60 → 0–30 R
      const val = v - 30;
      return `${val} R`;
    },
  },
  {
    id: 4,
    key: "rtToMain",
    group: "routing",
    label: "Route to Main",
    kind: ParamKind.SWITCH,
    classSelected: "btn-success",
    defaultRaw: 0, // 0/1 (or use true/false if you prefer)
    format: (v) => (v ? "On" : "Off"),
  },
  {
    id: 5,
    key: "rtToBus",
    group: "routing",
    label: "Route to Bus",
    kind: ParamKind.SWITCH,
    classSelected: "btn-success",
    defaultRaw: 0, // 0/1 (or use true/false if you prefer)
    format: (v) => (v ? "On" : "Off"),
  },
  {
    id: 6,
    key: "busVolume",
    label: "Bus Volume",
    kind: ParamKind.RANGE,
    min: 0,
    max: 1472,
    defaultRaw: 0,
    format: (v) => `${(-80 + v / 16).toFixed(1)} dB`,
  },
  {
    id: 6,
    key: "busVolumePrePost",
    label: "Bus Volume Pre/Post",
    kind: ParamKind.SWITCH,
    defaultRaw: 0, // 0/1 (or use true/false if you prefer)
    format: (v) => (v ? "Pre" : "Post"),
  },
  {
    id: 8,
    key: "busPan",
    label: "Bus Pan",
    kind: ParamKind.RANGE,
    min: 0,
    max: 60,
    defaultRaw: 30,
    format: (v) => `${(-30 + v).toFixed(0)} dB`,
  },
  {
    id: 9,
    key: "busPanFollowChannel",
    label: "Bus Pan Follow Channel",
    kind: ParamKind.SWITCH,
    defaultRaw: 0, // 0/1 (or use true/false if you prefer)
    format: (v) => (v ? "On" : "Off"),
  },
];

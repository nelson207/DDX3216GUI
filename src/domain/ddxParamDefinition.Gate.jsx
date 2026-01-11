export const GATE_PARAMS = [
  {
    id: 50,
    key: "gateOn",
    label: "Gate On",
    kind: ParamKind.SWITCH,
    defaultRaw: 0,
    format: (v) => (v ? "On" : "Off"),
  },
  {
    id: 51,
    key: "gateHold",
    label: "Gate Hold",
    kind: ParamKind.RANGE,
    min: 0,
    max: 255,
    defaultRaw: 0,
    format: (v) => {
      const ms = 10 * Math.pow(100, v / 255);
      return `${ms.toFixed(1)} ms`;
    },
  },
  {
    id: 52,
    key: "gateAttack",
    label: "Gate Attack",
    kind: ParamKind.RANGE,
    min: 0,
    max: 200,
    defaultRaw: 0,
    format: (v) => `${v} ms`,
  },
  {
    id: 53,
    key: "gateRelease",
    label: "Gate Release",
    kind: ParamKind.RANGE,
    min: 0,
    max: 255,
    defaultRaw: 0,
    format: (v) => {
      const ms = 20 * Math.pow(250, v / 255);
      return `${ms.toFixed(1)} ms`;
    },
  },
  {
    id: 54,
    key: "gateRange",
    label: "Gate Range",
    kind: ParamKind.RANGE,
    min: 0,
    max: 61,
    defaultRaw: 0,
    format: (v) => {
      if (v === 61) return "-∞ dB";
      return `-${v} dB`;
    },
  },
  {
    id: 55,
    key: "gateThreshold",
    label: "Gate Threshold",
    kind: ParamKind.RANGE,
    min: 0,
    max: 90,
    defaultRaw: 90,
    format: (v) => `${-90 + v} dB`,
  },
];

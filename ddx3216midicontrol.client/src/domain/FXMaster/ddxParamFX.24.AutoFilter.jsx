import { ParamKind } from "../ddxParamKind";
export const FX_AUTO_FILTER = {
  type: 24,
  name: "Auto Filter",

  params: [
    {
      index: 1, // 91
      label: "Base Freq",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => {
        // 100 Hz – 10 kHz, log
        const hz = 100 * Math.pow(100, v / 100);
        return `${hz.toFixed(1)} Hz`;
      },
    },
    {
      index: 2, // 92
      label: "Sensitivity",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 3, // 93
      label: "Attack",
      kind: ParamKind.RANGE,
      min: 0,
      max: 156,
      defaultRaw: 0,
      format: (v) => {
        // 10 – 1000 ms, log
        const ms = 10 * Math.pow(100, v / 156);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 4, // 94
      label: "Release",
      kind: ParamKind.RANGE,
      min: 0,
      max: 156,
      defaultRaw: 0,
      format: (v) => {
        // 10 – 1000 ms, log
        const ms = 10 * Math.pow(100, v / 156);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 5, // 95
      label: "Filter Mode",
      kind: ParamKind.ENUM,
      values: [0, 1, 2],
      labels: {
        0: "HP",
        1: "BP",
        2: "LP",
      },
      defaultRaw: 2,
      format: (v, def) => def.labels[v],
    },
    {
      index: 6, // 96
      label: "Filter Q",
      kind: ParamKind.RANGE,
      min: 0,
      max: 49,
      defaultRaw: 0,
      format: (v) => {
        // 1 – 20, log
        const q = 1 * Math.pow(20 / 1, v / 49);
        return `Q ${q.toFixed(2)}`;
      },
    },
    // 97–98 unused
  ],
};

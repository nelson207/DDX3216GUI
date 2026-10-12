import { ParamKind } from "../ddxParamKind";
import { fmtHz } from "./fxFormat";
export const FX_RING_MODULATOR = {
  type: 26,
  name: "Ring Modulator",

  params: [
    {
      index: 1, // 91
      label: "Mod Mode",
      kind: ParamKind.ENUM,
      values: [0, 1, 2, 3],
      labels: {
        0: "Sine",
        1: "Tri",
        2: "Square",
        3: "Env",
      },
      defaultRaw: 0,
      format: (v, def) => def.labels[v],
    },
    {
      index: 2, // 92
      label: "LFO Speed",
      kind: ParamKind.RANGE,
      min: 0,
      max: 107,
      defaultRaw: 0,
      format: (v) => {
        // 0.1 – 100 Hz, log
        const hz = 0.1 * Math.pow(1000, v / 107);
        return `${hz.toFixed(2)} Hz`;
      },
    },
    {
      index: 3, // 93
      label: "AM Carrier Freq",
      kind: ParamKind.RANGE,
      min: 0,
      max: 106,
      defaultRaw: 0,
      format: (v) => {
        // 0.1 – 10 kHz, log
        const hz = 100 * Math.pow(100, v / 106);
        return fmtHz(hz);
      },
    },
    {
      index: 4, // 94
      label: "Band Limit",
      kind: ParamKind.RANGE,
      min: 0,
      max: 121,
      defaultRaw: 121,
      format: (v) => {
        // 0.1 – 20 kHz, log
        const hz = 100 * Math.pow(200, v / 121);
        return fmtHz(hz);
      },
    },
    {
      index: 5, // 95
      label: "Modulation Depth",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 6, // 96
      label: "Env Response",
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
      index: 7, // 97
      label: "AM Depth",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    // 98 unused
  ],
};

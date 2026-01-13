import { ParamKind } from "../ddxParamKind";
export const FX_ENHANCER = {
  type: 21,
  name: "Enhancer",

  params: [
    {
      index: 1, // 91
      label: "High Freq",
      kind: ParamKind.RANGE,
      min: 0,
      max: 57,
      defaultRaw: 0,
      format: (v) => {
        // 1 – 12 kHz, log
        const khz = 1 * Math.pow(12 / 1, v / 57);
        return `${khz.toFixed(2)} kHz`;
      },
    },
    {
      index: 2, // 92
      label: "High Q",
      kind: ParamKind.RANGE,
      min: 0,
      max: 30,
      defaultRaw: 0,
      format: (v) => {
        // 1 – 4, lin (scale says lin)
        const q = 1 + (3 * v) / 30;
        return `Q ${q.toFixed(2)}`;
      },
    },
    {
      index: 3, // 93
      label: "Process",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 4, // 94
      label: "NR Resp",
      kind: ParamKind.RANGE,
      min: 0,
      max: 110,
      defaultRaw: 0,
      format: (v) => {
        // 20 – 400 ms, log
        const ms = 20 * Math.pow(400 / 20, v / 110);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 5, // 95
      label: "Bass Freq",
      kind: ParamKind.RANGE,
      min: 0,
      max: 53,
      defaultRaw: 0,
      format: (v) => {
        // 50 – 500 Hz, log
        const hz = 50 * Math.pow(500 / 50, v / 53);
        return `${hz.toFixed(1)} Hz`;
      },
    },
    {
      index: 6, // 96
      label: "Bass Q",
      kind: ParamKind.RANGE,
      min: 0,
      max: 30,
      defaultRaw: 0,
      format: (v) => {
        // 1 – 4, lin
        const q = 1 + (3 * v) / 30;
        return `Q ${q.toFixed(2)}`;
      },
    },
    {
      index: 7, // 97
      label: "Bass Level",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 8, // 98
      label: "NR Thresh",
      kind: ParamKind.RANGE,
      min: 0,
      max: 90,
      defaultRaw: 90,
      format: (v) => `${-90 + v} dB`,
    },
  ],
};

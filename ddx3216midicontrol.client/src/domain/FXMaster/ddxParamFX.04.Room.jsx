import { ParamKind } from "../ddxParamKind";
export const FX_ROOM = {
  type: 4,
  name: "Room",

  params: [
    {
      index: 1, // FX param 1 (91)
      label: "Decay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 43,
      defaultRaw: 0,
      format: (v) => {
        // 1 – 3 s, logarithmic
        const sec = 1 * Math.pow(3 / 1, v / 43);
        return `${sec.toFixed(2)} s`;
      },
    },
    {
      index: 2, // 92
      label: "Damping",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 3, // 93
      label: "Bass Multiply",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 50,
      format: (v) => `${v - 50}`,
    },
    {
      index: 4, // 94
      label: "Diffusion",
      kind: ParamKind.RANGE,
      min: 0,
      max: 20,
      defaultRaw: 0,
      format: (v) => String(v),
    },
    {
      index: 5, // 95
      label: "PreDelay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 92,
      defaultRaw: 0,
      format: (v) => {
        // 0 – 150 ms, logarithmic
        const ms = 150 * Math.pow(v / 92, 2);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 6, // 96
      label: "Mic Distance",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => String(v),
    },
    {
      index: 7, // 97
      label: "Hi-Shv Freq",
      kind: ParamKind.RANGE,
      min: 0,
      max: 53,
      defaultRaw: 0,
      format: (v) => {
        // 1 – 10 kHz, logarithmic
        const khz = 1 * Math.pow(10, v / 53);
        return `${khz.toFixed(2)} kHz`;
      },
    },
    {
      index: 8, // 98
      label: "Hi-Shv Damp",
      kind: ParamKind.RANGE,
      min: 0,
      max: 30,
      defaultRaw: 0,
      format: (v) => `${v} dB`,
    },
  ],
};

import { ParamKind } from "../ddxParamKind";
export const FX_CONCERT = {
  type: 5,
  name: "Concert",

  params: [
    {
      index: 1, // FX param 1 (91)
      label: "Decay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 90,
      defaultRaw: 0,
      format: (v) => {
        // 0.8 – 8 s, logarithmic
        const sec = 0.8 * Math.pow(8 / 0.8, v / 90);
        return `${sec.toFixed(2)} s`;
      },
    },
    {
      index: 2, // 92
      label: "HiDec Damp",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 3, // 93
      label: "ER/Rev Balance",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 50,
      format: (v) => `${v}%`,
    },
    {
      index: 4, // 94
      label: "Size",
      kind: ParamKind.RANGE,
      min: 0,
      max: 49,
      defaultRaw: 0,
      format: (v) => `${1 + v}`, // 1 – 50
    },
    {
      index: 5, // 95
      label: "PreDelay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 138,
      defaultRaw: 0,
      format: (v) => {
        // 0 – 490 ms, logarithmic
        const ms = 490 * Math.pow(v / 138, 2);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 6, // 96
      label: "ER Stereo Width",
      kind: ParamKind.RANGE,
      min: 0,
      max: 20,
      defaultRaw: 0,
      format: (v) => String(v),
    },
    {
      index: 7, // 97
      label: "Diffusion",
      kind: ParamKind.RANGE,
      min: 0,
      max: 20,
      defaultRaw: 0,
      format: (v) => String(v),
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

import { ParamKind } from "../ddxParamKind";

export const FX_PLATE = {
  type: 2,
  name: "Plate",

  params: [
    {
      index: 1, // FX param 1 (91)
      label: "Decay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 90,
      defaultRaw: 0,
      format: (v) => {
        // 1–10 s, logarithmic
        const sec = 1 * Math.pow(10, v / 90);
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
      label: "HiDec Freq",
      kind: ParamKind.RANGE,
      min: 0,
      max: 106,
      defaultRaw: 0,
      format: (v) => {
        // 0.2 – 20 kHz, logarithmic
        const hz = 0.2 * Math.pow(100, v / 106);
        return `${hz.toFixed(2)} kHz`;
      },
    },
    {
      index: 4, // 94
      label: "Stereo Width",
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
      max: 138,
      defaultRaw: 0,
      format: (v) => {
        // 0–490 ms, logarithmic
        const ms = 490 * Math.pow(v / 138, 2);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 6, // 96
      label: "Metal Resonance",
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
      label: "HiShv Cut",
      kind: ParamKind.RANGE,
      min: 0,
      max: 30,
      defaultRaw: 0,
      format: (v) => `${v} dB`,
    },
  ],
};

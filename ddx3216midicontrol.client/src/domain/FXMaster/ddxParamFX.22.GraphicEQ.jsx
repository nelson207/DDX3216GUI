import { ParamKind } from "../ddxParamKind";
export const FX_GRAPHIC_EQ = {
  type: 22,
  name: "Graphic EQ",

  params: [
    // shown low to high; the SysEx order is 50, 250, 1.5k, 7k, 100, 500, 3.5k, 14k
    {
      index: 1, // 91
      label: "50 Hz",
      kind: ParamKind.RANGE,
      min: 0,
      max: 60,
      defaultRaw: 30,
      format: (v) => `${((v - 30) / 2).toFixed(1)} dB`, // -15 … +15 in 0.5 dB steps
    },
    {
      index: 5, // 95
      label: "100 Hz",
      kind: ParamKind.RANGE,
      min: 0,
      max: 60,
      defaultRaw: 30,
      format: (v) => `${((v - 30) / 2).toFixed(1)} dB`,
    },
    {
      index: 2, // 92
      label: "250 Hz",
      kind: ParamKind.RANGE,
      min: 0,
      max: 60,
      defaultRaw: 30,
      format: (v) => `${((v - 30) / 2).toFixed(1)} dB`,
    },
    {
      index: 6, // 96
      label: "500 Hz",
      kind: ParamKind.RANGE,
      min: 0,
      max: 60,
      defaultRaw: 30,
      format: (v) => `${((v - 30) / 2).toFixed(1)} dB`,
    },
    {
      index: 3, // 93
      label: "1.5 kHz",
      kind: ParamKind.RANGE,
      min: 0,
      max: 60,
      defaultRaw: 30,
      format: (v) => `${((v - 30) / 2).toFixed(1)} dB`,
    },
    {
      index: 7, // 97
      label: "3.5 kHz",
      kind: ParamKind.RANGE,
      min: 0,
      max: 60,
      defaultRaw: 30,
      format: (v) => `${((v - 30) / 2).toFixed(1)} dB`,
    },
    {
      index: 4, // 94
      label: "7 kHz",
      kind: ParamKind.RANGE,
      min: 0,
      max: 60,
      defaultRaw: 30,
      format: (v) => `${((v - 30) / 2).toFixed(1)} dB`,
    },
    {
      index: 8, // 98
      label: "14 kHz",
      kind: ParamKind.RANGE,
      min: 0,
      max: 60,
      defaultRaw: 30,
      format: (v) => `${((v - 30) / 2).toFixed(1)} dB`,
    },
  ],
};

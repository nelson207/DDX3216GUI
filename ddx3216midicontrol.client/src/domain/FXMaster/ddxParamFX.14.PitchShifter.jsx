import { ParamKind } from "../ddxParamKind";
export const FX_PITCH_SHIFTER = {
  type: 14,
  name: "Pitch Shifter",

  params: [
    {
      index: 1, // 91
      label: "Semitones",
      kind: ParamKind.RANGE,
      min: 0,
      max: 24,
      defaultRaw: 12,
      format: (v) => `${v - 12}`, // -12 … +12
    },
    {
      index: 2, // 92
      label: "Cents",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 50,
      format: (v) => `${v - 50}`, // -50 … +50
    },
    {
      index: 3, // 93
      label: "Delay",
      kind: ParamKind.RANGE,
      min: 0,
      max: 158,
      defaultRaw: 0,
      format: (v) => {
        // 0 – 800 ms, log
        const ms = 800 * Math.pow(v / 158, 2);
        return `${ms.toFixed(1)} ms`;
      },
    },
    {
      index: 4, // 94
      label: "Feedback",
      kind: ParamKind.RANGE,
      min: 0,
      max: 80,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    // 95–98 unused
  ],
};

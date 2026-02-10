import { ParamKind } from "../ddxParamKind";
export const FX_STEREO_PHASER = {
  type: 13,
  name: "Stereo Phaser",

  params: [
    {
      index: 1, // 91
      label: "Stages",
      kind: ParamKind.RANGE,
      min: 2,
      max: 9,
      defaultRaw: 2,
      format: (v) => `${v}`, // 2 – 9
    },
    {
      index: 2, // 92
      label: "Speed",
      kind: ParamKind.RANGE,
      min: 0,
      max: 76,
      defaultRaw: 0,
      format: (v) => {
        // 0.1 – 14 Hz, log
        const hz = 0.1 * Math.pow(14 / 0.1, v / 76);
        return `${hz.toFixed(3)} Hz`;
      },
    },
    {
      index: 3, // 93
      label: "Depth",
      kind: ParamKind.RANGE,
      min: 0,
      max: 100,
      defaultRaw: 0,
      format: (v) => `${v}%`,
    },
    {
      index: 4, // 94
      label: "Feedback",
      kind: ParamKind.RANGE,
      min: 0,
      max: 198,
      defaultRaw: 99,
      format: (v) => `${v - 99}%`, // -99 … +99 %
    },
    {
      index: 5, // 95
      label: "Ste Phase",
      kind: ParamKind.RANGE,
      min: 0,
      max: 180,
      defaultRaw: 0,
      format: (v) => `${v}°`,
    },
    // 96–98 unused
  ],
};

import { ParamKind } from "./ddxParamKind";
function makeFXParams(fx) {
  const base = 80 + (fx - 1) * 2;
  return [
    {
      id: base,
      key: `fx${fx}Send`,
      label: `FX ${fx} Send Volume`,
      kind: ParamKind.RANGE,
      min: 0,
      max: 1472,
      defaultRaw: 0,
      format: (v) => `${(-80 + v / 16).toFixed(1)} dB`,
    },
    {
      id: base + 1,
      key: `fx${fx}PrePost`,
      label: `FX ${fx} Pre/Post`,
      kind: ParamKind.SWITCH,
      defaultRaw: 0,
      format: (v) => (v ? "Pre" : "Post"),
    },
  ];
}

export const FX_PARAMS = [
  ...makeFXParams(1), //fx 1
  ...makeFXParams(2), //fx 2
  ...makeFXParams(3), //fx 3
  ...makeFXParams(4), //fx 4
];

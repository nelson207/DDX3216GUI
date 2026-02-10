import { ParamKind } from "./ddxParamKind";

function makeAuxParams(aux) {
  const base = 70 + (aux - 1) * 2;
  return [
    {
      id: base,
      key: `aux${aux}Send`,
      label: `Aux ${aux} Send Volume`,
      kind: ParamKind.RANGE,
      min: 0,
      max: 1472,
      defaultRaw: 0,
      format: (v) => `${(-80 + v / 16).toFixed(1)} dB`,
    },
    {
      id: base + 1,
      key: `aux${aux}PrePost`,
      label: `Aux ${aux} Pre/Post`,
      kind: ParamKind.SWITCH,
      defaultRaw: 0,
      format: (v) => (v ? "Pre" : "Post"),
    },
  ];
}

export const AUX_PARAMS = [
  ...makeAuxParams(1), //aux 1
  ...makeAuxParams(2), //aux 2
  ...makeAuxParams(3), //aux 3
  ...makeAuxParams(4), //aux 4
];

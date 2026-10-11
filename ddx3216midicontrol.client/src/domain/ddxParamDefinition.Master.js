import { ParamKind } from "./ddxParamKind";
import { EQ_PARAMS } from "./ddxParamDefinition.EQ";
import { COMPRESSOR_PARAMS } from "./ddxParamDefinition.Compressor";

// Main (master, module 64) per the DDX3216 SysEx documentation: only volume (1), balance (3),
// EQ and compressor. Value ranges/formats are the channel ones, but several numbers differ.
export const MAIN_MODULE = 64;
export const MAIN_PROCESSORS = ["EQ", "Compressor"];

const MASTER_EQ_IDS = {
  eqOn: 20,
  eq1FilterType: 21, // High: Param / HC / HSh
  eq1Freq: 22,
  eq1Gain: 23,
  eq1Q: 24,
  eq2Freq: 26,
  eq2Gain: 27,
  eq2Q: 28,
  eq3Freq: 32,
  eq3Gain: 33,
  eq3Q: 34,
  eq4FilterType: 36, // Low: Param / LC / LSh
  eq4Freq: 37,
  eq4Gain: 38,
  eq4Q: 39,
};

// no high-pass on the master
export const MASTER_EQ_PARAMS = EQ_PARAMS.filter((d) => d.key in MASTER_EQ_IDS).map((d) => ({
  ...d,
  id: MASTER_EQ_IDS[d.key],
}));

// same numbers as the channels, but no key source (41); plus 48 = fader pre/post compressor
const MASTER_COMP_KEYS = ["compOn", "compAttack", "compRelease", "compRatio", "compKnee", "compThreshold", "compGain"];

export const MASTER_COMPRESSOR_PARAMS = [
  ...COMPRESSOR_PARAMS.filter((d) => MASTER_COMP_KEYS.includes(d.key)),
  {
    id: 48,
    key: "faderPrePostComp",
    label: "Fader pre/post compressor",
    kind: ParamKind.SWITCH,
    defaultRaw: 0,
    format: (v) => (v ? "Pre" : "Post"),
  },
];

import { AUX_PARAMS } from "./ddxParamDefinition.Aux";
import { BASE_PARAMS } from "./ddxParamDefinition.Base";
import { COMPRESSOR_PARAMS } from "./ddxParamDefinition.Compressor";
import { DELAY_PARAMS } from "./ddxParamDefinition.Delay";
import { EQ_PARAMS } from "./ddxParamDefinition.EQ";
import { FX_PARAMS } from "./ddxParamDefinition.FX";
import { GATE_PARAMS } from "./ddxParamDefinition.Gate";

export const PARAM_DEFS = [
  ...BASE_PARAMS,
  ...EQ_PARAMS,
  ...COMPRESSOR_PARAMS,
  ...GATE_PARAMS,
  ...DELAY_PARAMS,
  ...AUX_PARAMS,
  ...FX_PARAMS,
];

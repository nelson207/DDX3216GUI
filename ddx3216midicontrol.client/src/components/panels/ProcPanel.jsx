import { PARAM_DEFS } from "../../domain/ddxParamDefinition";
import { AUX_PARAMS } from "../../domain/ddxParamDefinition.Aux";
import { BASE_PARAMS } from "../../domain/ddxParamDefinition.Base";
import { COMPRESSOR_PARAMS } from "../../domain/ddxParamDefinition.Compressor";
import { DELAY_PARAMS } from "../../domain/ddxParamDefinition.Delay";
import { EQ_PARAMS } from "../../domain/ddxParamDefinition.EQ";
import { FX_PARAMS } from "../../domain/ddxParamDefinition.FX";
import { GATE_PARAMS } from "../../domain/ddxParamDefinition.Gate";
import ParamCell from "../control/ParamCell";

const MAIN_CHANNEL_ID = 64;

function paramsFor(selectedProcessor) {
  switch (selectedProcessor) {
    case "EQ":
      return EQ_PARAMS;
    case "Compressor":
      return COMPRESSOR_PARAMS;
    case "Gate":
      return GATE_PARAMS;
    case "Delay":
      return DELAY_PARAMS;
    case "Routing":
      return [
        ...PARAM_DEFS.filter((p) => p.group === "routing"),
        ...BASE_PARAMS.filter((p) => p.group === "bus"),
      ];
    case "Aux":
      return AUX_PARAMS;
    case "Fx":
      return FX_PARAMS;
    default:
      return [];
  }
}

function ProcPanel({ selectedChannel, selectedProcessor }) {
  const params = paramsFor(selectedProcessor);
  // "Main" -> module 64, channel N -> index N-1
  const channelid =
    selectedChannel === "Main" ? MAIN_CHANNEL_ID : selectedChannel - 1;
  const channelName =
    selectedChannel === "Main" ? "Main" : `Channel ${selectedChannel}`;

  return (
    <div className="proc-panel">
      <div className="proc-title">{`${channelName} – ${selectedProcessor}`}</div>
      <div className="row g-2">
        {params.map((def) => (
          <div
            key={`${channelid}-${def.id ?? def.key}`}
            className="col-12 col-sm-6 col-lg-4 col-xl-3"
          >
            <ParamCell
              def={def}
              value={def.defaultRaw}
              componentid={`ch_${channelid}_${def.key}`}
              channelid={channelid}
              channellabel={channelName}
              processorid={def.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProcPanel;

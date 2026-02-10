import { PARAM_DEFS } from "../../domain/ddxParamDefinition";
import { AUX_PARAMS } from "../../domain/ddxParamDefinition.Aux";
import { BASE_PARAMS } from "../../domain/ddxParamDefinition.Base";
import { COMPRESSOR_PARAMS } from "../../domain/ddxParamDefinition.Compressor";
import { DELAY_PARAMS } from "../../domain/ddxParamDefinition.Delay";
import { EQ_PARAMS } from "../../domain/ddxParamDefinition.EQ";
import { FX_PARAMS } from "../../domain/ddxParamDefinition.FX";
import { GATE_PARAMS } from "../../domain/ddxParamDefinition.Gate";
import ParamCell from "../control/ParamCell";

// "EQ", "Compressor", "Gate", "Delay", "Routing"

function ProcPanel({ selectedChannel, selectedProcessor }) {
  const params = (() => {
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
      case "Bus":
      default:
        return [];
    }
  })();

  return (
    <>
      <label className="px-2 py-1 fw-bold text-white">{`Channel ${selectedChannel} - ${selectedProcessor}`}</label>
      <div className="row g-2 p-2">
        {params.map((def) => (
          <div
            key={`${selectedChannel}-${def.id ?? def.key}`}
            className="col-12 col-md-6 col-lg-4 col-xl-3"
          >
            <ParamCell
              def={def}
              value={def.defaultRaw}
              componentid={`ch_${String(selectedChannel)}_${def.key}`}
              channelid={selectedChannel - 1} //Channel Index
              channellabel={""}
              processorid={def.id}
            />
          </div>
        ))}
      </div>
    </>
  );
}

export default ProcPanel;

import { ParamKind } from "../../domain/ddxParamKind";
import ParamKindEnumMultiTile from "./ParamKindEnumMultiTile";
import ParamKindEnumTile from "./ParamKindEnumTile";
import ParamKindRangeTile from "./ParamKindRangeTile";
import ParamKindSwitchTile from "./ParamKindSwitchTile";

function ParamCell(
  props = {
    def,
    value,
    componentid,
    channelid,
    channellabel,
    processorid,
  },
) {
  return (
    <div className="card bg-dark text-light border-secondary h-100">
      <div className="card-body py-2 d-flex flex-column gap-2">
        <div>
          <div className="small fw-semibold">{props.def.label}</div>
        </div>

        {props.def.kind === ParamKind.SWITCH && (
          <div>
            <ParamKindSwitchTile {...props} />
          </div>
        )}

        {props.def.kind === ParamKind.ENUM && (
          <div>
            <ParamKindEnumTile {...props} />
          </div>
        )}

        {props.def.kind === ParamKind.RANGE && (
          <div>
            <ParamKindRangeTile {...props} />
          </div>
        )}

        {props.def.kind === ParamKind.ENUMMULTI && (
          <div>
            <ParamKindEnumMultiTile {...props} />
          </div>
        )}
      </div>
    </div>
  );
}
export default ParamCell;

export function EmptyCell() {
  return (
    <div
      className="border border-secondary rounded-3 bg-dark bg-opacity-50"
      style={{
        borderStyle: "dashed",
        minHeight: 78,
        opacity: 0.5,
      }}
    />
  );
}

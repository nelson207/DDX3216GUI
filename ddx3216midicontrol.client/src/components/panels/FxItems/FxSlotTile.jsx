import { PARAM_DEFS } from "../../../domain/ddxParamDefinition";
import { FX_REGISTRY } from "../../../domain/FXMaster/ddxParamFXRegistry";
import { useParamValue } from "../../../router/useParamValue";
import ParamCell, { EmptyCell } from "../../control/ParamCell";
import ParamKindSwitchTile from "../../control/ParamKindSwitchTile";

const MAX_CELLS = 8;
const FX_TYPE_PARAM = 90;
const FX_SEND_BASE = 52; // FX 1..4 send modules 52..55
const FX_RETURN_BASE = 56; // FX n return L/R = 56 + 2(n-1) / +1 (see ChannelFunction)
const MUTE_PARAM = PARAM_DEFS.find((p) => p.key === "mute");

// FX send module -> FX return (left) module
function mapFxChannelSendToReturn(channelid) {
  return FX_RETURN_BASE + (channelid - FX_SEND_BASE) * 2;
}

export function FxSlotTile({ channelid }) {
  // FX type loaded in this slot (0 = empty), synced through the store
  const { value, update, loading } = useParamValue({
    channelid,
    processorid: FX_TYPE_PARAM,
    defaultRaw: 0,
  });

  const fxDef = FX_REGISTRY[value];
  const params = fxDef?.params ?? [];
  const cells = Array.from({ length: MAX_CELLS }, (_, i) => params[i] ?? null);

  const assignFxToSlot = (fxType) => update(fxType, { immediate: true });

  const clearSlot = () => {
    assignFxToSlot(0);
  };

  return (
    <div
      className="card bg-dark text-light border-secondary h-100"
      id={`chfx-${channelid}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        const type = Number(e.dataTransfer.getData("fx/type"));
        if (!Number.isFinite(type)) return;
        assignFxToSlot(type);
      }}
      style={{ minHeight: 360 }}
    >
      <div className="card-body d-flex flex-column gap-3">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div className="fw-bold">{`FX ${channelid - FX_SEND_BASE + 1}`}</div>
            {/* drag & drop doesn't exist on touch screens: pick from a list too */}
            <select
              className="form-select form-select-sm bg-dark text-light mt-1"
              aria-label={`FX ${channelid - FX_SEND_BASE + 1} type`}
              value={fxDef ? value : ""}
              onChange={(e) => assignFxToSlot(Number(e.target.value))}
            >
              {!fxDef && (
                <option value="" disabled>
                  Choose / drop FX
                </option>
              )}
              {Object.entries(FX_REGISTRY).map(([type, fx]) => (
                <option key={type} value={type}>
                  {fx.name}
                </option>
              ))}
            </select>
          </div>

          {fxDef ? (
            <>
              <ParamKindSwitchTile
                def={MUTE_PARAM}
                value={MUTE_PARAM.defaultRaw}
                componentid={`ch_${String(channelid)}_${MUTE_PARAM.key}`}
                channelid={mapFxChannelSendToReturn(channelid)}
                channellabel={""}
                processorid={MUTE_PARAM.id}
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={clearSlot}
              >
                Clear
              </button>
            </>
          ) : null}
        </div>

        <div className="row g-2 flex-grow-1 align-content-start">
          {loading ? (
            <span className="d-inline-flex align-items-center gap-2">
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              />
              <span>Loading…</span>
            </span>
          ) : (
            cells.map((p, i) =>
              p ? (
                <div className="col-6" key={p.index}>
                  <ParamCell
                    def={p}
                    value={p.defaultRaw ?? 0}
                    componentid={`ch${channelid}-p${p.index}`}
                    channelid={channelid}
                    channellabel={""}
                    processorid={p.index + 90}
                  />
                </div>
              ) : (
                <div className="col-6" key={`empty-${i}`}>
                  <EmptyCell />
                </div>
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
}

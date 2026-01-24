import { PARAM_DEFS } from "../../../domain/ddxParamDefinition";
import ParamCell, { EmptyCell } from "../../control/ParamCell";
import ParamKindSwitchTile from "../../control/ParamKindSwitchTile";

export function FxSlotTile({ channelid, fxDef, onClear, onDropFx }) {
  const MAX_CELLS = 8;
  const MUTE_PARAM = PARAM_DEFS.find((p) => p.key === "mute");
  const params = fxDef?.params ?? [];
  const cells = Array.from({ length: MAX_CELLS }, (_, i) => params[i] ?? null);

  function mapFxChannelSendToReturn(ch) {
    // ch is 51..54
    const base = 55 + (ch - 51) * 2;
    return base;
  }

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
        onDropFx(type);
      }}
      style={{ minHeight: 360 }}
    >
      <div className="card-body d-flex flex-column gap-3">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div className="fw-bold">{`FX ${channelid - 51}`}</div>
            <div className="small text-secondary">
              {fxDef ? fxDef.name : "Drop FX here"}
            </div>
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
                onClick={onClear}
              >
                Clear
              </button>
            </>
          ) : null}
        </div>

        {/* 2-column matrix */}
        <div className="row g-2 flex-grow-1 align-content-start">
          {!fxDef &&
            cells.map((_, i) => (
              <div className="col-6" key={i}>
                <EmptyCell />
              </div>
            ))}

          {fxDef &&
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
            )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { PARAM_DEFS } from "../../../domain/ddxParamDefinition";
import { FX_REGISTRY } from "../../../domain/FXMaster/ddxParamFXRegistry";
import { useReceiver, useSender } from "../../../router/MidiControl";
import ParamCell, { EmptyCell } from "../../control/ParamCell";
import ParamKindSwitchTile from "../../control/ParamKindSwitchTile";
import { useGetApiMidiStatusByModuleAndParamDefaultValueQuery } from "../../../router/apis/MidiApi";

export function FxSlotTile({ channelid }) {
  const MAX_CELLS = 8;
  const MUTE_PARAM = PARAM_DEFS.find((p) => p.key === "mute");
  const [cValue, setCValue] = useState();
  const { send } = useSender();
  const { lastMsg } = useReceiver();

  const { data, isLoading, isFetching } =
    useGetApiMidiStatusByModuleAndParamDefaultValueQuery({
      module: channelid,
      param: 90,
      defaultValue: 0,
    });

  useEffect(() => {
    if (data !== undefined) {
      assignFxToSlot(data, false);
    }
  }, [data]);

  // Send whenever cValue changes (but not before it exists)
  const updateAndSendValue = (updater) => {
    setCValue((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;

      if (next === undefined || next === prev) {
        return prev;
      }
      send([
        {
          Module: channelid,
          Param: 90,
          Value: Number(next),
        },
      ]);

      return next;
    });
  };

  useEffect(() => {
    if (!lastMsg || !Array.isArray(lastMsg)) return;

    for (const change of lastMsg) {
      if (change.Module === channelid && change.Param === 90) {
        assignFxToSlot(change.Value, false);
        break;
      }
    }
  }, [lastMsg]);

  function mapFxChannelSendToReturn() {
    // ch is 51..54
    const base = 55 + (channelid - 51) * 2;
    return base;
  }

  const getFxByType = (type) => {
    const defs = FX_REGISTRY[type];
    return defs;
  };

  const [fxDef, setFxDef] = useState(getFxByType(cValue));
  const params = fxDef?.params ?? [];
  const cells = Array.from({ length: MAX_CELLS }, (_, i) => params[i] ?? null);

  const assignFxToSlot = (fxType, sendToMidi = true) => {
    if (sendToMidi) updateAndSendValue(fxType);
    else setCValue(fxType);
    setFxDef(getFxByType(fxType));
  };

  const clearSlot = () => {
    assignFxToSlot(0);
  };

  const loading = isLoading || isFetching; // isFetching catches refetches too

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

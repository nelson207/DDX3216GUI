import { useEffect, useMemo, useState } from "react";
import { FX_REGISTRY } from "../../domain/FXMaster/ddxParamFXRegistry";
import { FxPaletteItem } from "./FxItems/FxPaletteItem";
import { FxSlotTile } from "./FxItems/FxSlotTile";
import sendThrottled from "../../router/MidiSend";
import { useReceiver, useSender } from "../../router/MidiControl";
import { useSelectedMidi } from "../../router/MidiSelected";

export default function FXPanel() {
  const SLOT_CHANNELS = [52, 53, 54, 55];
  const { selectedOut, selectedIn, selectedChannel } = useSelectedMidi();
  const sender = useSender(selectedOut);
  const { lastMsg } = useReceiver(selectedIn);
  const [slotFxType, setSlotFxType] = useState({
    52: 0,
    53: 0,
    54: 0,
    55: 0,
  });

  useEffect(() => {
    if (lastMsg?.decoded) {
      const changes = lastMsg?.decoded?.changes;

      if (!Array.isArray(changes)) return;

      for (const change of changes) {
        if (SLOT_CHANNELS.includes(change.module)) {
          if (change.param === 90) {
            const slotIndex = SLOT_CHANNELS.indexOf(change.module);
            assignFxToSlot(slotIndex, change.value14);
            return;
          }
        }
      }
    }
  }, [lastMsg]);

  function normalizeRegistry(registry) {
    return Array.isArray(registry) ? registry : Object.values(registry);
  }

  const fxList = useMemo(() => {
    const defs = normalizeRegistry(FX_REGISTRY).filter(Boolean);
    return defs.sort((a, b) => (a.type ?? 0) - (b.type ?? 0));
  }, []);

  const getFxByType = (type) => {
    const defs = normalizeRegistry(FX_REGISTRY);
    return defs.find((x) => x?.type === type);
  };

  const assignFxToSlot = (slotIndex, fxType) => {
    const fxDef = getFxByType(fxType);
    if (!fxDef) return;

    const ch = SLOT_CHANNELS[slotIndex];

    setSlotFxType((prev) => ({
      ...prev,
      [ch]: fxType,
    }));

    if (!selectedOut) return;

    sendThrottled(ch, 90, fxType, sender, selectedChannel);
  };

  const clearSlot = (slotIndex) => {
    assignFxToSlot(slotIndex, 0);
  };

  return (
    <div className="container-fluid text-light py-3 h-100">
      <div className="row g-3 h-100">
        <div className="col-12 col-lg-3">
          <div
            className="card bg-dark text-light border-secondary h-100"
            style={{ maxHeight: "80cqh", overflow: "auto" }}
          >
            <div className="card-body">
              <div className="fw-bold mb-2">FX Registry</div>
              <div className="d-grid gap-2">
                {fxList.map((fx) => (
                  <FxPaletteItem key={fx.type} fx={fx} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4 slots */}
        <div className="col-12 col-lg-9 h-100">
          <div className="row g-3 h-100">
            {[0, 1, 2, 3].map((slotindex) => {
              const channelid = SLOT_CHANNELS[slotindex];
              const fxType = slotFxType[channelid];
              const fxDef = fxType != null ? getFxByType(fxType) : null;

              return (
                <div
                  className="col-12 col-md-6 col-xl-3"
                  style={{ maxHeight: "80cqh", overflow: "auto" }}
                  key={`slot_${slotindex}_ch_${channelid}`}
                  id={`slot_${slotindex}_ch_${channelid}`}
                >
                  <FxSlotTile
                    channelid={channelid} //FX1, 2, 3, 4
                    fxDef={fxDef}
                    onClear={() => clearSlot(slotindex)}
                    onDropFx={(type) => assignFxToSlot(slotindex, type)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

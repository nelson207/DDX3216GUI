import { useMemo } from "react";
import { FX_REGISTRY } from "../../domain/FXMaster/ddxParamFXRegistry";
import { FxPaletteItem } from "./FxItems/FxPaletteItem";
import { FxSlotTile } from "./FxItems/FxSlotTile";

export default function FXPanel() {
  const SLOT_CHANNELS = [52, 53, 54, 55];

  function normalizeRegistry(registry) {
    return Array.isArray(registry) ? registry : Object.values(registry);
  }

  const fxList = useMemo(() => {
    const defs = normalizeRegistry(FX_REGISTRY).filter(Boolean);
    return defs.sort((a, b) => (a.type ?? 0) - (b.type ?? 0));
  }, []);

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
              return (
                <div
                  className="col-12 col-md-6 col-xl-3"
                  style={{ maxHeight: "80cqh", overflow: "auto" }}
                  key={`slot_${slotindex}_ch_${channelid}`}
                  id={`slot_${slotindex}_ch_${channelid}`}
                >
                  <FxSlotTile
                    channelid={channelid} //FX1, 2, 3, 4
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

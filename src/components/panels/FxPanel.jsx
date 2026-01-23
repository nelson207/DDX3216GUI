import { useMemo, useState } from "react";
import { FX_REGISTRY } from "../../domain/FXMaster/ddxParamFXRegistry";
import ParamCell from "../control/ParamCell";

/** Small helpers */
function fxStateKey(channel, slotIndex, fxType) {
  return `ch:${channel}:slot:${slotIndex}:type:${fxType}`;
}
function normalizeRegistry(registry) {
  return Array.isArray(registry) ? registry : Object.values(registry);
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn btn-sm ${
        active ? "btn-light text-dark" : "btn-outline-light"
      }`}
    >
      {children}
    </button>
  );
}

function FxPaletteItem({ fx }) {
  return (
    <div
      className="card bg-dark text-light border-secondary"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("fx/type", String(fx.type));
        e.dataTransfer.effectAllowed = "copy";
      }}
      title="Drag to a slot"
      style={{ cursor: "grab", userSelect: "none" }}
    >
      <div className="card-body py-2">
        <div className="fw-semibold">{fx.name}</div>
        <div className="small text-secondary">Type {fx.type}</div>
      </div>
    </div>
  );
}

function EmptyCell() {
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

function FxSlotTile({
  channel,
  slotIndex,
  fxDef,
  values,
  onClear,
  onDropFx,
  onParamChange,
}) {
  const MAX_CELLS = 8;
  const params = fxDef?.params ?? [];
  const visibleParams = params.slice(0, MAX_CELLS);
  const cells = Array.from(
    { length: MAX_CELLS },
    (_, i) => visibleParams[i] ?? null,
  );

  return (
    <div
      className="card bg-dark text-light border-secondary h-100"
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
            <div className="fw-bold">{`FX ${slotIndex + 1}`}</div>
            <div className="small text-secondary">
              {fxDef ? fxDef.name : "Drop FX here"}
            </div>
          </div>

          {fxDef ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={onClear}
            >
              Clear
            </button>
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
                    value={values[p.index] ?? p.defaultRaw ?? 0}
                    componentId={`ch${channel}-slot${slotIndex}-p${p.index}`}
                    channelId={channel}
                    channelLabel={""}
                    processorId={slotIndex}
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

export default function FXPanel({ receiver, selectedChannel }) {
  const [channel, setChannel] = useState(selectedChannel);
  const [section, setSection] = useState("fx");

  // Per-channel slots, store fx.type or null
  const [channelFxSlots, setChannelFxSlots] = useState(() => {
    const init = {};
    for (let ch = 1; ch <= 16; ch++) init[ch] = [null, null, null, null];
    return init;
  });

  // Param raw cache per channel+slot+type
  const [fxParamRaw, setFxParamRaw] = useState({});

  const channelOptions = useMemo(
    () => Array.from({ length: 16 }, (_, i) => i + 1),
    [],
  );

  const fxList = useMemo(() => {
    const defs = normalizeRegistry(FX_REGISTRY).filter(Boolean);
    return defs.sort((a, b) => (a.type ?? 0) - (b.type ?? 0));
  }, []);

  const slots = channelFxSlots[channel] ?? [null, null, null, null];

  const getFxByType = (type) => {
    const defs = normalizeRegistry(FX_REGISTRY);
    return defs.find((x) => x?.type === type);
  };

  const ensureParamState = (ch, slotIndex, fxType) => {
    const fxDef = getFxByType(fxType);
    if (!fxDef) return;

    const k = fxStateKey(ch, slotIndex, fxType);
    setFxParamRaw((prev) => {
      if (prev[k]) return prev;
      const init = {};
      for (const p of fxDef.params ?? []) init[p.index] = p.defaultRaw ?? 0;
      return { ...prev, [k]: init };
    });
  };

  const assignFxToSlot = (slotIndex, fxType) => {
    const fxDef = getFxByType(fxType);
    if (!fxDef) return;

    setChannelFxSlots((prev) => ({
      ...prev,
      [channel]: prev[channel].map((t, i) => (i === slotIndex ? fxType : t)),
    }));

    ensureParamState(channel, slotIndex, fxType);
  };

  const clearSlot = (slotIndex) => {
    setChannelFxSlots((prev) => ({
      ...prev,
      [channel]: prev[channel].map((t, i) => (i === slotIndex ? null : t)),
    }));
  };

  const updateFxParam = (slotIndex, fxType, paramIndex, raw) => {
    const k = fxStateKey(channel, slotIndex, fxType);
    setFxParamRaw((prev) => ({
      ...prev,
      [k]: { ...(prev[k] ?? {}), [paramIndex]: raw },
    }));
  };

  return (
    <div className="container-fluid text-light py-3">
      {/* Top bar */}
      <div className="d-flex align-items-center gap-2 mb-3">
        {/* Desktop/tablet (md and up): horizontal buttons */}
        <div className="d-none d-md-flex align-items-center gap-2">
          <span className="text-light me-1">Channel {selectedChannel}</span>
        </div>

        {/* Mobile (below md): dropdown only */}
        <div className="d-flex d-md-none align-items-center gap-2">
          <span className="text-light">Ch</span>
          <select
            className="form-select form-select-sm bg-dark text-light border-secondary"
            value={channel}
            onChange={(e) => setChannel(Number(e.target.value))}
            style={{ width: 96 }}
            aria-label="Channel"
          >
            {channelOptions.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row g-3">
        {/* Registry palette */}
        <div className="col-12 col-lg-3">
          <div
            className="card bg-dark text-light border-secondary h-100"
            style={{ maxHeight: "calc(100vh - 260px)", overflow: "auto" }}
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
        <div className="col-12 col-lg-9">
          <div className="row g-3">
            {[0, 1, 2, 3].map((slotIndex) => {
              const fxType = slots[slotIndex];
              const fxDef = fxType != null ? getFxByType(fxType) : null;

              const stateKey =
                fxType != null ? fxStateKey(channel, slotIndex, fxType) : null;
              const values = stateKey ? (fxParamRaw[stateKey] ?? {}) : {};

              return (
                <div className="col-12 col-md-6 col-xl-3" key={slotIndex}>
                  <FxSlotTile
                    channel={channel}
                    slotIndex={slotIndex}
                    fxDef={fxDef}
                    values={values}
                    onClear={() => clearSlot(slotIndex)}
                    onDropFx={(type) => assignFxToSlot(slotIndex, type)}
                    onParamChange={(paramIndex, raw) => {
                      if (fxType == null) return;
                      updateFxParam(slotIndex, fxType, paramIndex, raw);
                    }}
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

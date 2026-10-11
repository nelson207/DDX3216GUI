import { useState } from "react";
import { FX_REGISTRY } from "../../domain/FXMaster/ddxParamFXRegistry";
import { PARAM_DEFS } from "../../domain/ddxParamDefinition";
import { useParamValue } from "../../router/useParamValue";
import ParamControl, { Toggle } from "../control/ParamControl";

const FX_SEND_BASE = 52; // FX 1..4 = modules 52..55
const FX_RETURN_BASE = 56; // FX n return L = 56 + 2(n-1) (see ChannelFunction)
const FX_TYPE_PARAM = 90; // param 90 = FX type, 91..98 = FX params 1..8
const MUTE = PARAM_DEFS.find((p) => p.key === "mute");

const CATEGORIES = [
  { name: "Reverb", types: [1, 2, 3, 4, 5, 6, 7, 8] },
  { name: "Delay", types: [9, 10, 15] },
  { name: "Modulation", types: [11, 12, 13, 16, 17, 18, 19, 20] },
  { name: "Pitch", types: [14] },
  { name: "Filter & EQ", types: [21, 22, 23, 24] },
  { name: "Special", types: [25, 26] },
];
const categoryOf = (type) => CATEGORIES.find((c) => c.types.includes(type))?.name;

const sendModule = (n) => FX_SEND_BASE + n - 1;
const returnModule = (n) => FX_RETURN_BASE + (n - 1) * 2;

function useFxType(n) {
  return useParamValue({ channelid: sendModule(n), processorid: FX_TYPE_PARAM, defaultRaw: 0 });
}

function useReturnMute(n) {
  return useParamValue({ channelid: returnModule(n), processorid: MUTE.id, defaultRaw: MUTE.defaultRaw });
}

function SlotTab({ n, active, onSelect }) {
  const { value } = useFxType(n);
  const { value: mute } = useReturnMute(n);
  const fx = FX_REGISTRY[value];
  const empty = !value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`fx-tab${active ? " active" : ""}${empty ? " empty" : ""}`}
      onClick={onSelect}
    >
      <span className="fx-tab-top">
        <span className="fx-tab-n">FX {n}</span>
        {Boolean(Number(mute)) && <span className="fx-tab-muted">MUTED</span>}
      </span>
      <span className="fx-tab-name">{empty ? "Empty" : fx?.name ?? `Type ${value}`}</span>
      {!empty && <span className="fx-tab-cat">{categoryOf(value)}</span>}
    </button>
  );
}

function FxPicker({ current, onPick, onCancel }) {
  return (
    <div className="fx-picker">
      <div className="fx-picker-head">
        <h3>Choose effect</h3>
        <button type="button" className="fx-link" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {CATEGORIES.map((cat) => (
        <div key={cat.name} className="fx-cat">
          <div className="fx-cat-name">{cat.name}</div>
          <div className="fx-cat-grid">
            {cat.types.map((t) => (
              <button
                key={t}
                type="button"
                className={`fx-choice${t === current ? " current" : ""}`}
                aria-pressed={t === current}
                onClick={() => onPick(t)}
              >
                {FX_REGISTRY[t]?.name ?? `Type ${t}`}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        className={`fx-choice fx-bypass${current === 0 ? " current" : ""}`}
        onClick={() => onPick(0)}
      >
        Bypass / empty slot
      </button>
    </div>
  );
}

function FxSlot({ n }) {
  const { value: type, update: setType } = useFxType(n);
  const { value: mute, update: setMute } = useReturnMute(n);
  const [picking, setPicking] = useState(false);
  const fx = FX_REGISTRY[type];
  const params = fx?.params ?? [];
  const muted = Boolean(Number(mute));

  return (
    <section className="fx-slot module">
      <header className="module-head fx-slot-head">
        <h3>FX {n}</h3>
        <button
          type="button"
          className="fx-type-btn"
          aria-expanded={picking}
          onClick={() => setPicking((p) => !p)}
        >
          <span className="fx-type-name">{type ? fx?.name ?? `Type ${type}` : "Empty"}</span>
          {type ? <span className="fx-type-cat">{categoryOf(type)}</span> : null}
          <span aria-hidden="true">▾</span>
        </button>
        <Toggle
          id={`fx${n}_mute`}
          label="MUTE"
          on={muted}
          compact
          danger
          onChange={(v) => setMute(v ? 1 : 0, { immediate: true })}
        />
      </header>

      <div className="module-body">
        {picking ? (
          <FxPicker
            current={type}
            onCancel={() => setPicking(false)}
            onPick={(t) => {
              setType(t, { immediate: true });
              setPicking(false);
            }}
          />
        ) : params.length === 0 ? (
          <div className="fx-empty">
            <p>No effect loaded in this slot.</p>
            <button type="button" className="fx-load" onClick={() => setPicking(true)}>
              Choose an effect
            </button>
          </div>
        ) : (
          // key on type: the parameter set changes with the effect
          <div className="knob-row fx-params" key={type}>
            {params.map((p) => (
              <ParamControl
                key={p.index}
                def={p}
                channelid={sendModule(n)}
                processorid={FX_TYPE_PARAM + p.index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function FXPanel() {
  const [slot, setSlot] = useState(1);
  return (
    <div className="fx-panel">
      <div className="fx-tabs" role="tablist" aria-label="FX slots">
        {[1, 2, 3, 4].map((n) => (
          <SlotTab key={n} n={n} active={slot === n} onSelect={() => setSlot(n)} />
        ))}
      </div>
      <FxSlot key={slot} n={slot} />
    </div>
  );
}

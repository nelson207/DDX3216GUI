import { useParamSnapshot, useParamValue } from "../../../router/useParamValue";
import { PARAM_DEFS } from "../../../domain/ddxParamDefinition";
import { EQ_PARAMS } from "../../../domain/ddxParamDefinition.EQ";
import { COMPRESSOR_PARAMS } from "../../../domain/ddxParamDefinition.Compressor";
import { GATE_PARAMS } from "../../../domain/ddxParamDefinition.Gate";
import {
  MAIN_MODULE,
  MASTER_COMPRESSOR_PARAMS,
  MASTER_EQ_PARAMS,
} from "../../../domain/ddxParamDefinition.Master";
import { FX_REGISTRY } from "../../../domain/FXMaster/ddxParamFXRegistry";
import ParamControl, { Toggle } from "../../control/ParamControl";
import { BAND_COLORS } from "../../../functions/ProcCurves";
import { DynamicsGraph, EqGraph } from "./ProcGraphs";

const byKey = (defs) => Object.fromEntries(defs.map((d) => [d.key, d]));
const P = byKey(PARAM_DEFS);
// Main uses other parameter numbers for EQ/compressor (see ddxParamDefinition.Master)
const P_MAIN = { ...P, ...byKey(MASTER_EQ_PARAMS), ...byKey(MASTER_COMPRESSOR_PARAMS) };
const defsFor = (ch) => (ch === MAIN_MODULE ? P_MAIN : P);

// DDX band numbers run high -> low (1 = High, 4 = Low); shown low -> high like the desk.
// Only bands 1 and 4 have a filter type; the mids are parametric.
const BAND_NAMES = { 4: "Low", 3: "Lo-Mid", 2: "Hi-Mid", 1: "High" };
const bandsFor = (ch) => [4, 3, 2, 1].map((n) => ({ n, typeDef: defsFor(ch)[`eq${n}FilterType`] }));

/** Bound control by param key (resolved for the module: channel or Main) */
function C({ k, ch, label, size }) {
  const def = defsFor(ch)[k];
  if (!def) return null;
  return <ParamControl def={def} channelid={ch} processorid={def.id} label={label} size={size} />;
}

/** Card with a title and an optional on/off switch in the header */
function Module({ title, ch, onKey, className = "", children, extra }) {
  return (
    <section className={`module ${className}`}>
      <header className="module-head">
        <h3>{title}</h3>
        {extra}
        {onKey && <HeaderSwitch k={onKey} ch={ch} />}
      </header>
      <div className="module-body">{children}</div>
    </section>
  );
}

function HeaderSwitch({ k, ch }) {
  const def = defsFor(ch)[k];
  const { value, update } = useParamValue({ channelid: ch, processorid: def.id, defaultRaw: def.defaultRaw });
  const on = Boolean(Number(value));
  return (
    <Toggle
      id={`p_${ch}_${def.id}`}
      label={on ? "ON" : "OFF"}
      on={on}
      compact
      onChange={(v) => update(v ? 1 : 0, { immediate: true })}
    />
  );
}

export function EqPage({ ch }) {
  const isMain = ch === MAIN_MODULE;
  const values = useParamSnapshot(ch, isMain ? MASTER_EQ_PARAMS : EQ_PARAMS);
  const bands = bandsFor(ch);
  return (
    <div className="proc-grid">
      <Module title="Equalizer" ch={ch} onKey="eqOn" className="span-2">
        <EqGraph values={values} bands={bands} />
        <div className="eq-bands">
          {bands.map(({ n, typeDef }) => (
            <div className="eq-band" key={n} style={{ "--band": BAND_COLORS[n] }}>
              <div className="eq-band-name">{BAND_NAMES[n]}</div>
              {typeDef ? (
                <C k={`eq${n}FilterType`} ch={ch} label="Type" />
              ) : (
                <div className="pc-field">
                  <div className="pc-label">Type</div>
                  <div className="eq-band-fixed">Parametric</div>
                </div>
              )}
              <div className="knob-row">
                <C k={`eq${n}Freq`} ch={ch} label="Freq" size={56} />
                <C k={`eq${n}Gain`} ch={ch} label="Gain" size={56} />
                <C k={`eq${n}Q`} ch={ch} label="Q" size={56} />
              </div>
            </div>
          ))}
        </div>
      </Module>
      {!isMain && (
        <Module title="High-pass" ch={ch} onKey="highPassOn">
          <div className="knob-row">
            <C k="highPassFreq" ch={ch} label="Freq" />
          </div>
        </Module>
      )}
    </div>
  );
}

const ratioOf = (raw) => parseFloat(P.compRatio.labels?.[raw] ?? "1") || 1;

export function CompressorPage({ ch }) {
  const isMain = ch === MAIN_MODULE;
  const v = useParamSnapshot(ch, isMain ? MASTER_COMPRESSOR_PARAMS : COMPRESSOR_PARAMS);
  return (
    <div className="proc-grid">
      <Module title="Compressor" ch={ch} onKey="compOn" className="span-2 dyn-module">
        <DynamicsGraph
          mode="comp"
          on={Boolean(v.compOn)}
          threshold={-60 + v.compThreshold}
          ratio={ratioOf(v.compRatio)}
          knee={v.compKnee * 3}
          makeup={v.compGain}
        />
        <div className="dyn-controls">
          <div className="knob-row">
            <C k="compThreshold" ch={ch} label="Threshold" />
            <C k="compRatio" ch={ch} label="Ratio" />
            <C k="compKnee" ch={ch} label="Knee" />
            <C k="compGain" ch={ch} label="Gain" />
          </div>
          <div className="knob-row">
            <C k="compAttack" ch={ch} label="Attack" />
            <C k="compRelease" ch={ch} label="Release" />
          </div>
          {isMain ? (
            <C k="faderPrePostComp" ch={ch} label="Fader" />
          ) : (
            <C k="compKey" ch={ch} label="Key source" />
          )}
        </div>
      </Module>
    </div>
  );
}

export function GatePage({ ch }) {
  const v = useParamSnapshot(ch, GATE_PARAMS);
  return (
    <div className="proc-grid">
      <Module title="Gate" ch={ch} onKey="gateOn" className="span-2 dyn-module">
        <DynamicsGraph
          mode="gate"
          on={Boolean(v.gateOn)}
          threshold={-90 + v.gateThreshold}
          range={v.gateRange >= 61 ? 80 : v.gateRange}
        />
        <div className="dyn-controls">
          <div className="knob-row">
            <C k="gateThreshold" ch={ch} label="Threshold" />
            <C k="gateRange" ch={ch} label="Range" />
          </div>
          <div className="knob-row">
            <C k="gateAttack" ch={ch} label="Attack" />
            <C k="gateHold" ch={ch} label="Hold" />
            <C k="gateRelease" ch={ch} label="Release" />
          </div>
        </div>
      </Module>
    </div>
  );
}

export function DelayPage({ ch }) {
  return (
    <div className="proc-grid">
      <Module title="Channel delay" ch={ch} onKey="delayOn" className="span-2">
        <div className="knob-row">
          <C k="delayTime" ch={ch} label="Time" />
          <C k="delayFeedback" ch={ch} label="Feedback" />
          <C k="delayMix" ch={ch} label="Mix" />
        </div>
        <C k="delayPhase" ch={ch} label="Phase" />
      </Module>
    </div>
  );
}

export function RoutingPage({ ch }) {
  return (
    <div className="proc-grid">
      <Module title="Main mix" ch={ch}>
        <C k="rtToMain" ch={ch} label="Route to Main" />
      </Module>
      <Module title="Bus assign" ch={ch}>
        <C k="rtToBus" ch={ch} label="Bus pairs" />
      </Module>
      <Module title="Bus send" ch={ch} className="span-2">
        <div className="knob-row">
          <C k="busVolume" ch={ch} label="Level" />
          <C k="busPan" ch={ch} label="Pan" />
        </div>
        <div className="field-row">
          <C k="busVolumePrePost" ch={ch} label="Tap" />
          <C k="busPanFollowChannel" ch={ch} label="Pan follows channel" />
        </div>
      </Module>
    </div>
  );
}

const FX_SEND_BASE = 52;
const FX_TYPE_PARAM = 90;

function FxTypeName({ n }) {
  const { value } = useParamValue({ channelid: FX_SEND_BASE + n - 1, processorid: FX_TYPE_PARAM, defaultRaw: 0 });
  const name = value ? FX_REGISTRY[value]?.name ?? `Type ${value}` : "Empty";
  return <span className="module-sub">{name}</span>;
}

/** kind: "aux" | "fx" */
export function SendsPage({ ch, kind }) {
  return (
    <div className="proc-grid sends-grid">
      {[1, 2, 3, 4].map((n) => (
        <Module
          key={n}
          title={kind === "aux" ? `Aux ${n}` : `FX ${n}`}
          ch={ch}
          className={`send-module send-${kind}`}
          extra={kind === "fx" ? <FxTypeName n={n} /> : null}
        >
          <div className="knob-row">
            <C k={`${kind}${n}Send`} ch={ch} label="Send" />
          </div>
          <C k={`${kind}${n}PrePost`} ch={ch} label="Tap" />
        </Module>
      ))}
    </div>
  );
}

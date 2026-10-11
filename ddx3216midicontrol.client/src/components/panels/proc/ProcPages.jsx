import { useParamSnapshot, useParamValue } from "../../../router/useParamValue";
import { PARAM_DEFS } from "../../../domain/ddxParamDefinition";
import { EQ_PARAMS } from "../../../domain/ddxParamDefinition.EQ";
import { COMPRESSOR_PARAMS } from "../../../domain/ddxParamDefinition.Compressor";
import { GATE_PARAMS } from "../../../domain/ddxParamDefinition.Gate";
import { FX_REGISTRY } from "../../../domain/FXMaster/ddxParamFXRegistry";
import ParamControl, { Toggle } from "../../control/ParamControl";
import { BAND_COLORS } from "../../../functions/ProcCurves";
import { DynamicsGraph, EqGraph } from "./ProcGraphs";

const P = Object.fromEntries(PARAM_DEFS.map((d) => [d.key, d]));
const BAND_NAMES = ["Low", "Lo-Mid", "Hi-Mid", "High"];
const BANDS = [1, 2, 3, 4].map((n) => ({ n, typeDef: P[`eq${n}FilterType`] }));

/** Bound control by param key */
function C({ k, ch, label, size }) {
  const def = P[k];
  return <ParamControl def={def} channelid={ch} processorid={def.id} label={label} size={size} />;
}

/** Card with a title and an optional on/off switch in the header */
export function Module({ title, ch, onKey, className = "", children, extra }) {
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
  const def = P[k];
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
  const values = useParamSnapshot(ch, EQ_PARAMS);
  return (
    <div className="proc-grid">
      <Module title="Equalizer" ch={ch} onKey="eqOn" className="span-2">
        <EqGraph values={values} bands={BANDS} />
        <div className="eq-bands">
          {BANDS.map(({ n }) => (
            <div className="eq-band" key={n} style={{ "--band": BAND_COLORS[n - 1] }}>
              <div className="eq-band-name">{BAND_NAMES[n - 1]}</div>
              <C k={`eq${n}FilterType`} ch={ch} label="Type" />
              <div className="knob-row">
                <C k={`eq${n}Freq`} ch={ch} label="Freq" size={56} />
                <C k={`eq${n}Gain`} ch={ch} label="Gain" size={56} />
                <C k={`eq${n}Q`} ch={ch} label="Q" size={56} />
              </div>
            </div>
          ))}
        </div>
      </Module>
      <Module title="High-pass" ch={ch} onKey="highPassOn">
        <div className="knob-row">
          <C k="highPassFreq" ch={ch} label="Freq" />
        </div>
      </Module>
    </div>
  );
}

const ratioOf = (raw) => parseFloat(P.compRatio.labels?.[raw] ?? "1") || 1;

export function CompressorPage({ ch }) {
  const v = useParamSnapshot(ch, COMPRESSOR_PARAMS);
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
          <C k="compKey" ch={ch} label="Key source" />
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

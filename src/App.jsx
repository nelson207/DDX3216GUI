import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import ChannelControl from "./components/ChannelControlComponent";
import {
  useMidi,
  packIC,
  useSender,
  clamp,
  useReceiver,
  buildCurrentSettingsRequest,
  decodeDdXParamChange,
  toHex,
} from "./router/MidiControl";

function Field({ label, children, hint }) {
  return (
    <label className="block mb-3">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      {children}
      {hint ? <div className="text-xs text-gray-400 mt-1">{hint}</div> : null}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  min = 0,
  max = 127,
  step = 1,
  className = "",
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full border rounded-lg px-3 py-2 ${className}`}
    />
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`px-3 py-1 rounded-full text-sm border ${
        checked ? "bg-black text-white" : "bg-white"
      }`}
    >
      {checked ? "On" : "Off"}
    </button>
  );
}

function App() {
  const [count, setCount] = useState(0);
  const [gain, setGain] = useState(50);
  // specify how many channels you want
  const [channelCount, setChannelCount] = useState(16);
  const [selectedOut, setSelectedOut] = useState(null);
  const [selectedIn, setSelectedIn] = useState(null);
  const { supported, inputs, outputs, error } = useMidi();
  const [ic, setIc] = useState(packIC({ midiChannel: 1, ignoreFlags: 0 }));
  const [apparatusId, setApparatusId] = useState(11);
  const [omni, setOmni] = useState(false);
  const [ignoreAppId, setIgnoreAppId] = useState(false);
  const sender = useSender(selectedOut);
  const { lastMsg } = useReceiver(selectedIn);

  useEffect(() => {
    if (!selectedIn) return; // user picked MIDI IN
    if (!selectedOut) return; // need MIDI OUT to send request
    if (!sender?.send) return;

    const modules = Array.from({ length: 1 }, (_, i) => i); // 0..channelCount-1
    // optionally include MAIN module 64 if that's correct for your setup:
    // modules.push(64);

    // Build requests for mute param=2
    const reqs = modules.map((m) => ({ module: m, param: 2 }));

    // Must be sent in chunks of max 23
    for (let i = 0; i < reqs.length; i += 23) {
      const chunk = reqs.slice(i, i + 23);
      const bytes = buildCurrentSettingsRequest({
        ic,
        apparatusId,
      });
      console.log(toHex(bytes));
      console.log(decodeDdXParamChange(bytes));
      sender.send(bytes);
    }
  }, [selectedIn, selectedOut]);

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="MIDI Output">
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={selectedOut?.id || ""}
            onChange={(e) =>
              setSelectedOut(
                outputs.find((o) => o.id === e.target.value) || null
              )
            }
          >
            <option value="">— Select an output —</option>
            {outputs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="(Optional) MIDI Input monitor">
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={selectedIn?.id || ""}
            onChange={(e) =>
              setSelectedIn(inputs.find((i) => i.id === e.target.value) || null)
            }
          >
            <option>— Select an input —</option>
            {inputs.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mt-4">
        <Field label="MIDI Channel (1–16)">
          <NumberInput
            min={1}
            max={16}
            value={(ic & 0x0f) + 1}
            onChange={(ch) =>
              setIc(((ic & 0x70) | clamp(ch - 1, 0, 15)) & 0x7f)
            }
          />
        </Field>
        <Field label="Apparatus ID">
          <NumberInput
            min={0}
            max={127}
            value={apparatusId}
            onChange={setApparatusId}
          />
        </Field>
        <Field label="Ignore: MIDI Channel (Omni)">
          <Toggle checked={omni} onChange={setOmni} />
        </Field>
        <Field label="Ignore: App ID">
          <Toggle checked={ignoreAppId} onChange={setIgnoreAppId} />
        </Field>
      </div>

      <div className="container-fluid">
        <table className="w-100 bg-secondary" style={{ tableLayout: "fixed" }}>
          <tbody>
            <tr>
              {Array.from({ length: channelCount }, (_, i) => (
                <td key={i}>
                  <ChannelControl
                    channelNumber={i + 1}
                    channelIndex={i}
                    ic={ic}
                    apparatusId={apparatusId}
                    sender={sender}
                    receiver={lastMsg}
                  />
                </td>
              ))}
              <td key="0">
                <ChannelControl
                  channelNumber={"Main"}
                  channelIndex={64}
                  ic={ic}
                  apparatusId={apparatusId}
                  sender={sender}
                  receiver={lastMsg}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default App;

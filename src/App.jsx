import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // <-- IMPORTANT for dropdown
import "./App.css";

import TopNavBar from "./components/TopNavBarComponent";
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
import { buildFadersForView } from "./functions/ChannelFunction";

// ... keep your Field / NumberInput / Toggle as-is

function App() {
  const VIEW_RANGES = {
    ch1_16: { start: 0, count: 16 },
    ch17_32: { start: 16, count: 16 },
    bus1_16: { start: 32, count: 16 },
    aux_fx: { start: 48, count: 16 },
  };

  const [activeView, setActiveView] = useState("ch1_16");
  const [selectedOut, setSelectedOut] = useState(null);
  const [selectedIn, setSelectedIn] = useState(null);
  const { inputs, outputs } = useMidi();

  const [ic, setIc] = useState(packIC({ midiChannel: 1, ignoreFlags: 0 }));
  const [apparatusId, setApparatusId] = useState(11);
  const [omni, setOmni] = useState(false);
  const [ignoreAppId, setIgnoreAppId] = useState(false);

  const sender = useSender(selectedOut);
  const { lastMsg } = useReceiver(selectedIn);

  // convenience helpers for MIDI channel 1..16
  const midiChannel = (ic & 0x0f) + 1;
  const setMidiChannel = (ch) =>
    setIc(((ic & 0x70) | clamp(ch - 1, 0, 15)) & 0x7f);

  useEffect(() => {
    if (!selectedIn) return;
    if (!selectedOut) return;
    if (!sender?.send) return;

    const modules = Array.from({ length: 1 }, (_, i) => i);
    const reqs = modules.map((m) => ({ module: m, param: 2 }));

    for (let i = 0; i < reqs.length; i += 23) {
      const bytes = buildCurrentSettingsRequest({ ic, apparatusId });
      console.log(toHex(bytes));
      console.log(decodeDdXParamChange(bytes));
      sender.send(bytes);
    }
  }, [selectedIn, selectedOut]);

  const { start, count } = VIEW_RANGES[activeView] ?? VIEW_RANGES.ch1_16;
  const faders = buildFadersForView(activeView);

  return (
    <>
      <TopNavBar
        activeView={activeView}
        setActiveView={setActiveView}
        inputs={inputs}
        outputs={outputs}
        selectedIn={selectedIn}
        selectedOut={selectedOut}
        setSelectedIn={setSelectedIn}
        setSelectedOut={setSelectedOut}
        midiChannel={midiChannel}
        setMidiChannel={setMidiChannel}
      />

      {/* The rest of your UI can remain below */}
      {/* ... your existing Field / Apparatus / etc ... */}

      <div className="container-fluid mt-3 fixed-bottom mb-2">
        <table className="w-100 fader-table" style={{ tableLayout: "fixed" }}>
          <tbody>
            <tr>
              {faders.map(({ label, channelIndex }) => (
                <td key={channelIndex}>
                  <ChannelControl
                    channelName={label}
                    channelIndex={channelIndex}
                    ic={ic}
                    apparatusId={apparatusId}
                    sender={sender}
                    receiver={lastMsg}
                  />
                </td>
              ))}
              {/* MAIN stays always visible */}
              <td key="main">
                <ChannelControl
                  channelName="Main"
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

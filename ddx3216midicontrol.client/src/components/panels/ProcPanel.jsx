import { useSelector } from "react-redux";
import {
  CompressorPage,
  DelayPage,
  EqPage,
  GatePage,
  RoutingPage,
  SendsPage,
} from "./proc/ProcPages";

const MAIN_CHANNEL_ID = 64;
// selectable channels: 1..32 + Main
const CHANNELS = [...Array.from({ length: 32 }, (_, i) => i + 1), "Main"];

const PROCESSORS = [
  { key: "EQ", label: "EQ" },
  { key: "Compressor", label: "Comp" },
  { key: "Gate", label: "Gate" },
  { key: "Delay", label: "Delay" },
  { key: "Routing", label: "Routing" },
  { key: "Aux", label: "Aux sends" },
  { key: "Fx", label: "FX sends" },
];

function ProcessorPage({ processor, ch }) {
  switch (processor) {
    case "EQ":
      return <EqPage ch={ch} />;
    case "Compressor":
      return <CompressorPage ch={ch} />;
    case "Gate":
      return <GatePage ch={ch} />;
    case "Delay":
      return <DelayPage ch={ch} />;
    case "Routing":
      return <RoutingPage ch={ch} />;
    case "Aux":
      return <SendsPage ch={ch} kind="aux" />;
    case "Fx":
      return <SendsPage ch={ch} kind="fx" />;
    default:
      return null;
  }
}

function ProcPanel({ selectedChannel, onSelectChannel, selectedProcessor, onSelectProcessor }) {
  // "Main" -> module 64, channel N -> index N-1
  const ch = selectedChannel === "Main" ? MAIN_CHANNEL_ID : selectedChannel - 1;
  const idx = CHANNELS.indexOf(selectedChannel);
  const step = (d) => onSelectChannel(CHANNELS[(idx + d + CHANNELS.length) % CHANNELS.length]);
  const isMain = selectedChannel === "Main";
  const labels = useSelector((s) => s.ws.scene?.labels);
  const optionLabel = (c) => {
    const base = c === "Main" ? "Main" : `CH ${c}`;
    const custom = labels?.[c === "Main" ? MAIN_CHANNEL_ID : c - 1]?.name;
    return custom ? `${base} · ${custom}` : base;
  };

  return (
    <div className="proc-panel">
      <div className="proc-head">
        <div className={`ch-stepper${isMain ? " main" : ""}`}>
          <button type="button" className="ch-step" onClick={() => step(-1)} aria-label="Previous channel">
            ‹
          </button>
          <select
            className="ch-select"
            aria-label="Channel"
            value={String(selectedChannel)}
            onChange={(e) =>
              onSelectChannel(e.target.value === "Main" ? "Main" : Number(e.target.value))
            }
          >
            {CHANNELS.map((c) => (
              <option key={c} value={String(c)}>
                {optionLabel(c)}
              </option>
            ))}
          </select>
          <button type="button" className="ch-step" onClick={() => step(1)} aria-label="Next channel">
            ›
          </button>
        </div>

        <div className="proc-tabs" role="tablist" aria-label="Processor">
          {PROCESSORS.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={selectedProcessor === p.key}
              className={`proc-tab${selectedProcessor === p.key ? " active" : ""}`}
              onClick={() => onSelectProcessor(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="proc-content" role="tabpanel">
        {/* key: remount per channel so held-control state never leaks between channels */}
        <ProcessorPage key={`${ch}_${selectedProcessor}`} processor={selectedProcessor} ch={ch} />
      </div>
    </div>
  );
}

export default ProcPanel;

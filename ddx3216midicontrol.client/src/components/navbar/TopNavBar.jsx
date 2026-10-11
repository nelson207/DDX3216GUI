import { useCallback, useState } from "react";
import headerLogoUrl from "../../assets/header-logo-behringer.svg";
import { DDX_VIEW_RANGES } from "../../domain/ddxViewRanges";
import MidiSettingsPanel, { MidiButton } from "./MidiSettingsPanel";

export default function TopNavBar({ activeView, setActiveView }) {
  const [midiOpen, setMidiOpen] = useState(false);
  const closeMidi = useCallback(() => setMidiOpen(false), []);

  return (
    <>
      <nav className="topbar">
        <img src={headerLogoUrl} className="topbar-logo" alt="Behringer" />

        <div className="topbar-tabs" role="tablist">
          {Object.entries(DDX_VIEW_RANGES).map(([key, { label, short }]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeView === key}
              className={`topbar-tab${activeView === key ? " active" : ""}`}
              onClick={() => setActiveView(key)}
              title={label}
            >
              <span className="d-none d-xl-inline">{label}</span>
              <span className="d-xl-none">{short ?? label}</span>
            </button>
          ))}
        </div>

        <div className="topbar-right">
          <MidiButton
            expanded={midiOpen}
            onClick={() => setMidiOpen((o) => !o)}
          />
        </div>
      </nav>

      <MidiSettingsPanel open={midiOpen} onClose={closeMidi} />
    </>
  );
}

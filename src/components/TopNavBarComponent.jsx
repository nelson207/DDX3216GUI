import React from "react";

/**
 * Props:
 * - activeView: string ("ch1_16" | "ch16_32" | "bus" | "aux" | "fx")
 * - setActiveView: (view: string) => void
 * - inputs, outputs: arrays from useMidi()
 * - selectedIn, selectedOut: selected MIDI port objects (or null)
 * - setSelectedIn, setSelectedOut: setters
 * - midiChannel: number 1..16
 * - setMidiChannel: (n: number) => void
 */
export default function TopNavBar({
  activeView,
  setActiveView,
  inputs,
  outputs,
  selectedIn,
  selectedOut,
  setSelectedIn,
  setSelectedOut,
  midiChannel,
  setMidiChannel,
}) {
  const tabs = [
    { key: "ch1_16", label: "Channel 1–16" },
    { key: "ch17_32", label: "Channel 17–32" },
    { key: "bus1_16", label: "Bus Out 1-16" },
    { key: "aux_fx", label: "Aux/FX" },
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-dark px-3 fixed-top">
      <a className="navbar-brand fw-semibold" href="#">
        <img
          src="src/assets/header-logo-behringer.svg"
          height="32"
          className="d-inline-block align-text-top text-white"
        />
      </a>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#topNav"
        aria-controls="topNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>

      <div className="collapse navbar-collapse" id="topNav">
        {/* LEFT: tabs */}
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          {tabs.map((t) => (
            <li className="nav-item" key={t.key}>
              <button
                type="button"
                className={`nav-link btn btn-link text-decoration-none ${
                  activeView === t.key ? "active" : ""
                }`}
                onClick={() => setActiveView(t.key)}
                style={{ padding: "0.5rem 0.75rem" }}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>

        {/* RIGHT: dropdown settings */}
        <div className="d-flex align-items-center">
          <div className="dropdown">
            <button
              className="btn btn-outline-light dropdown-toggle"
              type="button"
              id="midiDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              MIDI Settings
            </button>

            <div
              className="dropdown-menu dropdown-menu-end p-3 text-white bg-dark"
              aria-labelledby="midiDropdown"
              style={{ minWidth: 320 }}
            >
              {/* MIDI IN */}
              <div className="mb-3">
                <label className="form-label mb-1">MIDI In</label>
                <select
                  className="form-select  text-white"
                  value={selectedIn?.id || ""}
                  onChange={(e) =>
                    setSelectedIn(
                      inputs.find((i) => i.id === e.target.value) || null
                    )
                  }
                >
                  <option value="" className="text-white">
                    — Select input —
                  </option>
                  {inputs.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* MIDI OUT */}
              <div className="mb-3">
                <label className="form-label mb-1">MIDI Out</label>
                <select
                  className="form-select  text-white"
                  value={selectedOut?.id || ""}
                  onChange={(e) =>
                    setSelectedOut(
                      outputs.find((o) => o.id === e.target.value) || null
                    )
                  }
                >
                  <option value="" className="text-white">
                    — Select output —
                  </option>
                  {outputs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* MIDI CHANNEL */}
              <div className="mb-2">
                <label className="form-label mb-1">MIDI Channel</label>
                <select
                  className="form-select text-white"
                  value={midiChannel}
                  onChange={(e) => setMidiChannel(Number(e.target.value))}
                >
                  {Array.from({ length: 16 }, (_, idx) => idx + 1).map((ch) => (
                    <option key={ch} value={ch} className="text-white">
                      {ch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-secondary small mt-2 text-white">
                Tip: choose both In + Out before requesting settings.
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

import headerLogoUrl from "../../assets/header-logo-behringer.svg";
import { useSelector, useDispatch } from "react-redux";
import {
  setSelectedMidiDeviceIn,
  setSelectedMidiDeviceOut,
  setSelectedMidiChannel,
} from "../../router/slices/midiSlice";
import { DDX_VIEW_RANGES } from "../../domain/ddxViewRanges";
import { useMidi } from "../../router/MidiControl";

export default function TopNavBar({ activeView, setActiveView }) {
  const dispatch = useDispatch();
  const selectedIn = useSelector((s) => s.midi.selectedMidiDeviceIn);
  const selectedOut = useSelector((s) => s.midi.selectedMidiDeviceOut);
  const selectedChannel = useSelector((s) => s.midi.selectedMidiChannel);
  const { inputs, outputs } = useMidi();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark px-3 bg-dark z-3 h-100 w-100">
      <a className="navbar-brand fw-semibold" href="#">
        <img
          src={headerLogoUrl}
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
          {Object.entries(DDX_VIEW_RANGES).map(([key, { label }]) => (
            <li className="nav-item" key={key}>
              <button
                type="button"
                className={`nav-link btn btn-link text-decoration-none fw-bold m-2 ${
                  activeView === key ? "active" : ""
                }`}
                onClick={() => setActiveView(key)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* RIGHT: dropdown settings */}
        <div className="d-flex align-items-center">
          <div className="dropdown">
            <button
              className="btn btn-outline-light dropdown-toggle fw-bold"
              type="button"
              id="midiDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              MIDI Settings
            </button>

            <div
              className="dropdown-menu dropdown-menu-end p-3 text-white bg-dark fw-bold"
              aria-labelledby="midiDropdown"
              style={{ minWidth: 320 }}
            >
              {/* MIDI IN */}
              <div className="mb-3">
                <label className="form-label mb-1">MIDI In</label>
                <select
                  className="form-select  text-white"
                  value={selectedIn || ""}
                  onChange={(e) =>
                    dispatch(setSelectedMidiDeviceIn(e.target.value || null))
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
                  value={selectedOut || ""}
                  onChange={(e) =>
                    dispatch(setSelectedMidiDeviceOut(e.target.value || null))
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
                  value={selectedChannel}
                  onChange={(e) =>
                    dispatch(setSelectedMidiChannel(Number(e.target.value)))
                  }
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

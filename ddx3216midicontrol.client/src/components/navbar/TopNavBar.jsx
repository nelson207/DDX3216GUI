import headerLogoUrl from "../../assets/header-logo-behringer.svg";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { StatusLed } from "../types/StatusLed";

import {
  useGetApiMidiDevicesQuery,
  usePostApiMidiInSelectByIndexMutation,
  usePostApiMidiOutSelectByIndexMutation,
  usePostApiMidiChannelByChannelMutation,
  usePostApiMidiDevicesRefreshMutation,
} from "../../router/apis/MidiApi";

import { DDX_VIEW_RANGES } from "../../domain/ddxViewRanges";

export default function TopNavBar({ activeView, setActiveView }) {
  const isConnected = useSelector((s) => s.ws.connected);

  const { data, isFetching, isError, refetch } = useGetApiMidiDevicesQuery(
    undefined,
    { skip: !isConnected },
  );

  const [selectMidiIn, selectMidiInState] =
    usePostApiMidiInSelectByIndexMutation();
  const [selectMidiOut, selectMidiOutState] =
    usePostApiMidiOutSelectByIndexMutation();
  const [setMidiChannel, setMidiChannelState] =
    usePostApiMidiChannelByChannelMutation();
  const [refreshDevices, refreshDevicesState] =
    usePostApiMidiDevicesRefreshMutation();

  useEffect(() => {
    if (
      selectMidiInState.isSuccess ||
      selectMidiOutState.isSuccess ||
      setMidiChannelState.isSuccess ||
      refreshDevicesState.isSuccess
    ) {
      refetch();
    }
  }, [
    selectMidiInState.isSuccess,
    selectMidiOutState.isSuccess,
    setMidiChannelState.isSuccess,
    refreshDevicesState.isSuccess,
    refetch,
  ]);

  // JS-safe normalization
  const inDevices = (data && data.inDevices) || [];
  const outDevices = (data && data.outDevices) || [];
  const selectedMidiDeviceIn = (data && data.selectedInDevice) ?? null;
  const selectedMidiDeviceOut = (data && data.selectedOutDevice) ?? null;
  const selectedMidiChannel = (data && data.channel) ?? 1;

  const busy =
    isFetching ||
    selectMidiInState.isLoading ||
    selectMidiOutState.isLoading ||
    setMidiChannelState.isLoading ||
    refreshDevicesState.isLoading;

  return (
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
        <StatusLed />

          <div className="dropdown">
            <button
              className="btn btn-sm btn-outline-light dropdown-toggle fw-bold"
              type="button"
              id="midiDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              disabled={!isConnected || busy}
            >
              MIDI
            </button>

            <div
              className="dropdown-menu dropdown-menu-end p-3 text-white bg-dark fw-bold"
              aria-labelledby="midiDropdown"
              style={{ width: "min(320px, 92vw)" }}
            >
              {isError && (
                <div className="alert alert-danger py-2">
                  Failed to load MIDI devices.
                </div>
              )}

              <div className="mb-3">
                <label className="form-label mb-1">MIDI In</label>
                <select
                  className="form-select bg-dark text-white"
                  value={selectedMidiDeviceIn ?? ""}
                  onChange={(e) =>
                    selectMidiIn({ index: Number(e.target.value) })
                  }
                >
                  <option value="" disabled>
                    Select MIDI IN
                  </option>
                  {inDevices.map((d) => (
                    <option key={d.index} value={d.index}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label mb-1">MIDI Out</label>
                <select
                  className="form-select bg-dark text-white"
                  value={selectedMidiDeviceOut ?? ""}
                  onChange={(e) =>
                    selectMidiOut({ index: Number(e.target.value) })
                  }
                >
                  <option value="" disabled>
                    Select MIDI OUT
                  </option>
                  {outDevices.map((d) => (
                    <option key={d.index} value={d.index}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label mb-1">MIDI Channel</label>
                <select
                  className="form-select bg-dark text-white"
                  value={selectedMidiChannel}
                  onChange={(e) =>
                    setMidiChannel({ channel: Number(e.target.value) })
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
              <div className="mb-3 d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light fw-bold"
                  disabled={!isConnected || busy}
                  onClick={() => refreshDevices()}
                >
                  {refreshDevicesState.isLoading
                    ? "Refreshing..."
                    : "Refresh devices"}
                </button>

                {/* optional: show refresh error */}
                {refreshDevicesState.isError && (
                  <span className="small text-danger align-self-center">
                    Refresh failed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
    </nav>
  );
}

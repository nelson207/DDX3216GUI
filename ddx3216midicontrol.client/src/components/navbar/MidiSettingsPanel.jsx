import { useEffect, useRef } from "react";
import {
  usePostApiMidiChannelByChannelMutation,
  usePostApiMidiDevicesRefreshMutation,
  usePostApiMidiInSelectByIndexMutation,
  usePostApiMidiOutSelectByIndexMutation,
} from "../../router/apis/MidiApi";
import {
  isInternalPort,
  isLoopback,
  portFullName,
  portName,
  useMidiStatus,
} from "../../router/useMidiStatus";

const CHANNELS = Array.from({ length: 16 }, (_, i) => i + 1);

function errorText(error) {
  if (!error) return null;
  if (typeof error.data === "string" && error.data) return error.data;
  if (error.data?.title) return error.data.title;
  if (error.error) return error.error;
  return "Request failed";
}

/** Top bar trigger: LED + short status, opens the panel */
export function MidiButton({ onClick, expanded }) {
  const { state, outPort, channel } = useMidiStatus();
  const label =
    state === "offline"
      ? "Offline"
      : state === "warn"
        ? outPort
          ? "Loopback only"
          : "Set up MIDI"
        : `${portName(outPort)} · Ch ${channel}`;

  return (
    <button
      type="button"
      className={`midi-btn midi-${state}`}
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      title={`MIDI: ${label}`}
    >
      <span className="midi-led" aria-hidden="true" />
      <span className="midi-btn-text">
        <span className="midi-btn-title">MIDI</span>
        <span className="midi-btn-sub d-none d-md-block">{label}</span>
      </span>
    </button>
  );
}

function PortList({ ports, selectedIndex, pendingIndex, disabled, onSelect, emptyText }) {
  // hide the server's own RtMidi ports unless one is (wrongly) selected
  const visible = ports.filter(
    (p) => !isInternalPort(p) || p.index === selectedIndex,
  );
  const hidden = ports.length - visible.length;

  if (visible.length === 0) {
    return <div className="midi-empty">{emptyText}</div>;
  }
  return (
    <div className="midi-ports" role="radiogroup">
      {visible.map((port) => {
        const selected = port.index === selectedIndex;
        const pending = port.index === pendingIndex;
        return (
          <button
            key={port.index}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`midi-port${selected ? " selected" : ""}`}
            disabled={disabled || pending}
            onClick={() => !selected && onSelect(port.index)}
            title={portFullName(port)}
          >
            <span className="midi-radio" aria-hidden="true" />
            <span className="midi-port-name">{portName(port)}</span>
            {isLoopback(port) && (
              <span className="midi-badge" title="Software loopback, not a hardware interface">
                loopback
              </span>
            )}
            {pending && (
              <span className="spinner-border spinner-border-sm" aria-label="Selecting" />
            )}
          </button>
        );
      })}
      {hidden > 0 && (
        <div className="midi-hint mb-0">
          {hidden} internal server port{hidden > 1 ? "s" : ""} hidden
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, ok, warn, value, title }) {
  const cls = ok ? "ok" : warn ? "warn" : "off";
  return (
    <div className="midi-summary-row">
      <span className={`midi-dot midi-dot-${cls}`} aria-hidden="true" />
      <span className="midi-summary-label">{label}</span>
      <span className="midi-summary-value" title={title}>
        {value}
      </span>
    </div>
  );
}

export default function MidiSettingsPanel({ open, onClose }) {
  const midi = useMidiStatus();
  const { connected, query, outPorts, inPorts, outIndex, inIndex, channel } = midi;

  const [selectOut, outState] = usePostApiMidiOutSelectByIndexMutation();
  const [selectIn, inState] = usePostApiMidiInSelectByIndexMutation();
  const [setChannel, channelState] = usePostApiMidiChannelByChannelMutation();
  const [refresh, refreshState] = usePostApiMidiDevicesRefreshMutation();

  const closeRef = useRef(null);

  // focus handling + Esc to close
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  const pendingChannel = channelState.isLoading
    ? channelState.originalArgs?.channel
    : null;
  const refreshing = refreshState.isLoading || query.isFetching;

  return (
    <>
      <div
        className={`sheet-backdrop${open ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`sheet${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="midi-sheet-title"
        aria-hidden={!open}
        inert={!open}
      >
        <header className="sheet-header">
          <h2 id="midi-sheet-title">MIDI setup</h2>
          <button
            ref={closeRef}
            type="button"
            className="sheet-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="sheet-body">
          <div className="midi-summary">
            <SummaryRow
              label="Server"
              ok={connected}
              value={connected ? "Connected" : "Offline · retrying…"}
            />
            <SummaryRow
              label="Output"
              ok={outIndex !== null && !isLoopback(midi.outPort)}
              warn={connected && (outIndex === null || isLoopback(midi.outPort))}
              value={outIndex !== null ? portName(midi.outPort) : "Not selected"}
              title={midi.outPort ? portFullName(midi.outPort) : undefined}
            />
            <SummaryRow
              label="Input"
              ok={inIndex !== null}
              value={inIndex !== null ? portName(midi.inPort) : "Not selected"}
              title={midi.inPort ? portFullName(midi.inPort) : undefined}
            />
            <SummaryRow label="Channel" ok={connected} value={channel} />
          </div>

          {!connected && (
            <div className="midi-note midi-note-error">
              Can't reach the server. It reconnects automatically as soon as
              it's back.
            </div>
          )}
          {connected && outIndex === null && (
            <div className="midi-note midi-note-warn">
              Select an output port — until then fader and button changes are
              not sent to the console.
            </div>
          )}
          {connected && isLoopback(midi.outPort) && (
            <div className="midi-note midi-note-warn">
              The output is a software loopback, so nothing reaches the
              console. Connect the DDX3216's MIDI interface to the server and
              press <b>Rescan ports</b>.
            </div>
          )}
          {query.isError && (
            <div className="midi-note midi-note-error">
              Couldn't load MIDI ports: {errorText(query.error)}
            </div>
          )}

          <section className="midi-section">
            <div className="midi-section-head">
              <h3>Output → console</h3>
              <span className="midi-tag">required</span>
            </div>
            <p className="midi-hint">Changes made here are sent to this port.</p>
            <PortList
              ports={outPorts}
              selectedIndex={outIndex}
              pendingIndex={outState.isLoading ? outState.originalArgs?.index : null}
              disabled={!connected}
              onSelect={(index) => selectOut({ index })}
              emptyText={connected ? "No output ports found." : "—"}
            />
            {outState.isError && (
              <div className="midi-field-error">{errorText(outState.error)}</div>
            )}
          </section>

          <section className="midi-section">
            <div className="midi-section-head">
              <h3>Input ← console</h3>
              <span className="midi-tag midi-tag-dim">optional</span>
            </div>
            <p className="midi-hint">
              Lets the app follow changes made on the desk.
            </p>
            <PortList
              ports={inPorts}
              selectedIndex={inIndex}
              pendingIndex={inState.isLoading ? inState.originalArgs?.index : null}
              disabled={!connected}
              onSelect={(index) => selectIn({ index })}
              emptyText={connected ? "No input ports found." : "—"}
            />
            {inState.isError && (
              <div className="midi-field-error">{errorText(inState.error)}</div>
            )}
          </section>

          <section className="midi-section">
            <div className="midi-section-head">
              <h3>MIDI channel</h3>
            </div>
            <p className="midi-hint">Must match the MIDI channel set on the DDX3216.</p>
            <div className="midi-channels" role="radiogroup" aria-label="MIDI channel">
              {CHANNELS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  role="radio"
                  aria-checked={ch === channel}
                  className={`midi-ch${ch === channel ? " selected" : ""}${
                    ch === pendingChannel ? " pending" : ""
                  }`}
                  disabled={!connected || channelState.isLoading}
                  onClick={() => ch !== channel && setChannel({ channel: ch })}
                >
                  {ch}
                </button>
              ))}
            </div>
            {channelState.isError && (
              <div className="midi-field-error">{errorText(channelState.error)}</div>
            )}
          </section>
        </div>

        <footer className="sheet-footer">
          <span className="midi-count">
            {connected
              ? `${outPorts.length} out · ${inPorts.length} in`
              : "Offline"}
          </span>
          <button
            type="button"
            className="midi-refresh"
            disabled={!connected || refreshing}
            onClick={() => refresh()}
          >
            {refreshing && (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            )}
            {refreshing ? "Scanning…" : "Rescan ports"}
          </button>
          {refreshState.isError && (
            <div className="midi-field-error w-100">
              {errorText(refreshState.error)}
            </div>
          )}
        </footer>
      </aside>
    </>
  );
}

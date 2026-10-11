import { useSelector } from "react-redux";
import { useGetApiMidiDevicesQuery } from "./apis/MidiApi";

// some drivers (RtMidi on Windows) report garbage names: show "Port N" instead
// eslint-disable-next-line no-control-regex
const unreadable = (name) => !name?.trim() || /[\u0000-\u001f\ufffd]/.test(name);

/** Full port name as reported by the server (used for tooltips) */
export const portFullName = (port) =>
  unreadable(port?.name) ? `Port ${port?.index ?? "?"}` : port.name.trim();

/**
 * Short display name. ALSA reports "Client:Port 14:0":
 * drop the address and the client prefix when the port repeats it.
 */
export function portName(port) {
  const full = portFullName(port).replace(/\s+\d+:\d+$/, "");
  const sep = full.indexOf(":");
  if (sep < 0) return full;
  const client = full.slice(0, sep).trim();
  const name = full.slice(sep + 1).trim();
  return name.toLowerCase().startsWith(client.toLowerCase())
    ? name
    : `${client} · ${name}`;
}

/** Software loopback, not a hardware interface */
export const isLoopback = (port) =>
  /through|loopback/i.test(port?.name ?? "");

/** The server's own RtMidi client ports (selecting them loops the server to itself) */
export const isInternalPort = (port) => /^RtMidi\b/i.test(port?.name ?? "");

/** Shared MIDI/server state used by the top bar button and the panel */
export function useMidiStatus() {
  const connected = useSelector((s) => s.ws.connected);
  const query = useGetApiMidiDevicesQuery(undefined, { skip: !connected });
  const data = query.data;

  const outPorts = data?.outDevices ?? [];
  const inPorts = data?.inDevices ?? [];
  const outIndex = data?.selectedOutDevice ?? null;
  const inIndex = data?.selectedInDevice ?? null;
  const outPort = outPorts.find((p) => p.index === outIndex) ?? null;
  // saved port that is currently unplugged (the server reopens it when it comes back)
  const outMissing =
    connected && !!data?.selectedOutName && data?.outConnected === false;
  const inMissing =
    connected && !!data?.selectedInName && data?.inConnected === false;

  // ok = changes reach a real MIDI port; warn = they go nowhere / to a loopback
  const state = !connected
    ? "offline"
    : outIndex === null || outMissing || isLoopback(outPort)
      ? "warn"
      : "ok";

  return {
    connected,
    state,
    query,
    outPorts,
    inPorts,
    outIndex,
    inIndex,
    outPort,
    outMissing,
    inMissing,
    outName: data?.selectedOutName ?? null,
    inName: data?.selectedInName ?? null,
    inPort: inPorts.find((p) => p.index === inIndex) ?? null,
    channel: data?.channel ?? 1,
  };
}

import { useSelector } from "react-redux";
import { useGetApiMidiDevicesQuery } from "../../router/apis/MidiApi";

// green = connected and MIDI OUT selected, amber = connected but the server
// will ignore changes (no MIDI OUT), red = no connection to the server
export function StatusLed() {
  const connected = useSelector((s) => s.ws.connected);
  const { data } = useGetApiMidiDevicesQuery(undefined, { skip: !connected });
  const hasMidiOut =
    data?.selectedOutDevice !== null && data?.selectedOutDevice !== undefined;

  const [color, text] = !connected
    ? ["#ef4444", "Disconnected"]
    : hasMidiOut
      ? ["#22c55e", "Connected"]
      : ["#f59e0b", "No MIDI out"];

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8 }}
      title={text}
      role="status"
      aria-label={text}
    >
      <span className="text-white fw-bold small d-none d-md-inline">
        {text}
      </span>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </div>
  );
}

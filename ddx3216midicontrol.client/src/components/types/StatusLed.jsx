import { useSelector } from "react-redux";

export function StatusLed() {
  const status = useSelector((s) => s.ws.connected);

  const color =
    status === true
      ? "#22c55e" // green
      : "#ef4444"; // red

  const text = status === true ? "Connected" : "Disconnected";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }} title={text}>
      <span className="text-white fw-bold m-2">{text}</span>
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

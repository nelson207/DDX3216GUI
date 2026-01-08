import { useMemo } from "react";
import { normToDb, N_BREAKS } from "../functions/DBFunction";

// Your 9-interval breakpoints

export default function FaderScale({
  height = 500,
  knobSize = 70,
  padding = 8,
  width = 48, // scale column width
  fontSize = 12,
  showMinorTicks = true,
}) {
  const travel = useMemo(
    () => height - padding * 2 - knobSize,
    [height, padding, knobSize]
  );

  // norm(0..100) -> y position aligned to knob center
  const normToY = (norm) => {
    const ratio = norm / 100; // 0..1
    return (1 - ratio) * travel + padding + knobSize / 2;
  };

  // Build major tick marks at the exact breakpoints
  const majorTicks = useMemo(() => {
    return N_BREAKS.map((n) => ({
      norm: n,
      y: normToY(n),
      db: normToDb(n), // <-- expects norm 0..100
    }));
  }, [travel, padding, knobSize]);

  // Optional minor ticks: a few evenly spaced norms just for visual guidance
  const minorTicks = useMemo(() => {
    if (!showMinorTicks) return [];
    const norms = [10, 20, 30, 40, 55, 65, 70, 80, 90]; // tweak/remove freely
    return norms
      .filter((n) => !N_BREAKS.includes(n))
      .map((n) => ({ norm: n, y: normToY(n) }));
  }, [showMinorTicks, travel, padding, knobSize]);

  return (
    <div style={{ height, width, position: "relative", userSelect: "none" }}>
      {/* Major ticks + labels */}
      {majorTicks.map((t) => (
        <div
          key={t.norm}
          style={{
            position: "absolute",
            left: 0,
            top: t.y,
            transform: "translateY(-50%)",
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 10,
              height: 1,
              background: "currentColor",
              opacity: 0.9,
            }}
          />
          <div style={{ fontSize, opacity: 0.9, lineHeight: 1 }}>
            {Number.isFinite(t.db) ? t.db.toFixed(0) : "-∞"}
          </div>
        </div>
      ))}

      {/* Minor ticks (no labels) */}
      {minorTicks.map((t) => (
        <div
          key={`m-${t.norm}`}
          style={{
            position: "absolute",
            left: 0,
            top: t.y,
            transform: "translateY(-50%)",
            width: 8,
            height: 1,
            background: "currentColor",
            opacity: 0.35,
          }}
        />
      ))}
    </div>
  );
}

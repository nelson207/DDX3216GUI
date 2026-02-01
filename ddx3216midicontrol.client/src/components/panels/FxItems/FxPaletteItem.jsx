export function FxPaletteItem({ fx }) {
  return (
    <div
      className="card bg-dark text-light border-secondary"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("fx/type", String(fx.type));
        e.dataTransfer.effectAllowed = "copy";
      }}
      title="Drag to a slot"
      style={{ cursor: "grab", userSelect: "none" }}
    >
      <div className="card-body py-2">
        <div className="fw-semibold">{fx.name}</div>
        <div className="small text-secondary">Type {fx.type}</div>
      </div>
    </div>
  );
}

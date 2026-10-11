import { useEffect, useRef, useState } from "react";
import { DDX_VIEW_RANGES } from "../../domain/ddxViewRanges";

/**
 * Phone / small-tablet replacement for the view tabs: one clearly labelled button with the
 * current view that opens a menu of all views (large touch targets, with descriptions).
 */
export default function ViewSwitcher({ activeView, setActiveView }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const current = DDX_VIEW_RANGES[activeView];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    // focus the current view for keyboard users
    wrapRef.current?.querySelector(".view-menu-item.active")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="view-switch-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`view-switch${open ? " open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`View: ${current?.label ?? ""}. Change view`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="view-switch-text">
          <span className="view-switch-kicker">View</span>
          <span className="view-switch-label">{current?.short ?? current?.label}</span>
        </span>
        <span className="view-switch-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="view-menu" role="menu" aria-label="Views">
          {Object.entries(DDX_VIEW_RANGES).map(([key, view]) => (
            <button
              key={key}
              type="button"
              role="menuitemradio"
              aria-checked={key === activeView}
              className={`view-menu-item${key === activeView ? " active" : ""}`}
              onClick={() => {
                setActiveView(key);
                setOpen(false);
              }}
            >
              <span className="view-menu-title">{view.label}</span>
              <span className="view-menu-desc">{view.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useId, useRef } from "react";

/** Side sheet (full width on phones): backdrop, Esc / ✕ to close, focus returns to the opener. */
export default function Sheet({ open, onClose, title, children, footer }) {
  const titleId = useId();
  const closeRef = useRef(null);
  // latest onClose without re-running the focus effect (callers often pass inline functions)
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return (
    <>
      <div className={`sheet-backdrop${open ? " open" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside
        className={`sheet${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
        inert={!open}
      >
        <header className="sheet-header">
          <h2 id={titleId}>{title}</h2>
          <button ref={closeRef} type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="sheet-body">{open && children}</div>
        {footer && <footer className="sheet-footer">{footer}</footer>}
      </aside>
    </>
  );
}

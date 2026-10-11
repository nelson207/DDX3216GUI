import { useEffect, useState } from "react";

/** Destructive action that needs a second tap within a few seconds (works on touch, unlike confirm()). */
export default function ConfirmButton({ children, confirmLabel = "Tap again to confirm", onConfirm, className = "", disabled }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="button"
      className={`${className}${armed ? " armed" : ""}`}
      disabled={disabled}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}

import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { usePutApiScenesByIdLabelsAndModuleMutation } from "../../router/apis/MidiApi";
import { apiErrorText } from "../../functions/ApiErrors";

const COLORS = ["#3d8bfd", "#f08c00", "#2fb344", "#ae3ec9", "#e5383b", "#f5c400", "#20c997", "#868e96"];

/** Rename / recolour one strip in the active scene (empty name = back to the default name). */
export default function FaderNameDialog({ module, defaultName, onClose }) {
  const scene = useSelector((s) => s.ws.scene);
  const current = scene?.labels?.[module];
  const [name, setName] = useState(current?.name ?? "");
  const [color, setColor] = useState(current?.color ?? null);
  const [save, saveState] = usePutApiScenesByIdLabelsAndModuleMutation();
  const inputRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
    const onKey = (e) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const submit = async (label) => {
    if (!scene) return;
    const res = await save({ id: scene.id, module, setLabelRequest: label });
    if (!res.error) onClose(); // the new name arrives for everyone over the WebSocket
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Name for ${defaultName}`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          submit({ name: name.trim(), color });
        }}
      >
        <h2>
          {defaultName}
          <span className="dialog-sub">in scene “{scene?.name}”</span>
        </h2>
        <input
          ref={inputRef}
          value={name}
          maxLength={32}
          placeholder={defaultName}
          onChange={(e) => setName(e.target.value)}
          aria-label="Fader name"
        />
        <div className="color-row" role="radiogroup" aria-label="Colour">
          <button
            type="button"
            role="radio"
            aria-checked={color === null}
            className={`color-swatch none${color === null ? " on" : ""}`}
            onClick={() => setColor(null)}
            title="Default colour"
          />
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              className={`color-swatch${color === c ? " on" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
        </div>
        {saveState.error && <div className="midi-note midi-note-error">{apiErrorText(saveState.error)}</div>}
        <div className="dialog-actions">
          <button type="button" className="scene-btn" onClick={() => submit({ name: "", color: null })} disabled={saveState.isLoading || !current}>
            Reset
          </button>
          <span style={{ flex: 1 }} />
          <button type="button" className="scene-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="scene-btn scene-btn-primary" disabled={saveState.isLoading}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

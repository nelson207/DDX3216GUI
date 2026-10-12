import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  usePutApiScenesByIdLabelsAndModuleMutation,
  usePutApiScenesByIdPairsAndModuleMutation,
} from "../../router/apis/MidiApi";
import { isPairable, oddOf, usePair } from "../../router/usePair";
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
        {isPairable(module) && <PairSection module={module} sceneId={scene?.id} />}
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

/** Stereo pairing of an input channel with its neighbour (C1+C2, C3+C4 …) in the active scene. */
function PairSection({ module, sceneId }) {
  const pair = usePair(module);
  const [setPair, state] = usePutApiScenesByIdPairsAndModuleMutation();
  const [note, setNote] = useState(null);
  const odd = oddOf(module);
  const names = `C ${odd + 1} + C ${odd + 2}`;

  const toggle = async () => {
    setNote(null);
    const res = await setPair({ id: sceneId, module, setPairRequest: { paired: !pair } });
    if (res.error) setNote({ ok: false, text: apiErrorText(res.error) });
    else if (res.data.note) setNote({ ok: false, text: res.data.note });
    else if (res.data.paired) setNote({ ok: true, text: `Paired: C ${odd + 1} left, C ${odd + 2} right; settings copied.` });
    else setNote({ ok: true, text: "Unpaired: the channels are independent again." });
  };

  return (
    <div className="pair-section">
      <button
        type="button"
        className={`pc-toggle${pair ? " on" : ""}`}
        aria-pressed={Boolean(pair)}
        disabled={!sceneId || state.isLoading}
        onClick={toggle}
      >
        <span className="pc-toggle-led" aria-hidden="true" />
        Stereo pair {names}
      </button>
      <p className="pair-help">
        {pair
          ? "Every change on one channel also applies to the other; pan is mirrored (left/right)."
          : `Links ${names} as left/right: C ${odd + 2} takes the settings of C ${odd + 1}, then every change applies to both.`}
      </p>
      {note && (
        <div className={`midi-note ${note.ok ? "scene-note-ok" : "midi-note-error"}`} role="status">
          {note.text}
        </div>
      )}
    </div>
  );
}

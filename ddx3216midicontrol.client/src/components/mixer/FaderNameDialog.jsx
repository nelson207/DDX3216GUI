import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  usePutApiScenesByIdLabelsAndModuleMutation,
  usePutApiScenesByIdPairsAndModuleMutation,
} from "../../router/apis/MidiApi";
import { isPairable, oddOf, partnerOf, usePair } from "../../router/usePair";
import { apiErrorText } from "../../functions/ApiErrors";

const COLORS = ["#3d8bfd", "#f08c00", "#2fb344", "#ae3ec9", "#e5383b", "#f5c400", "#20c997", "#868e96"];

/**
 * Rename / recolour one strip in the active scene (empty name = back to the default name).
 * Input channels also get the stereo-pair switch; like the name, it only applies on Save
 * (pairing copies the odd channel to the even one, so it must not happen on a stray tap).
 * Paired channels share their name and colour: Save applies them to both.
 */
export default function FaderNameDialog({ module, defaultName, onClose }) {
  const scene = useSelector((s) => s.ws.scene);
  const current = scene?.labels?.[module];
  const [name, setName] = useState(current?.name ?? "");
  const [color, setColor] = useState(current?.color ?? null);
  const [save, saveState] = usePutApiScenesByIdLabelsAndModuleMutation();
  const pairable = isPairable(module);
  const paired = Boolean(usePair(module));
  const [pairDraft, setPairDraft] = useState(paired);
  const [setPair, pairState] = usePutApiScenesByIdPairsAndModuleMutation();
  const [pairNote, setPairNote] = useState(null);
  const busy = saveState.isLoading || pairState.isLoading;
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

  // the new name / pairing arrive for everyone over the WebSocket
  const submit = async (label, { withPair = true } = {}) => {
    if (!scene) return;
    setPairNote(null);
    const res = await save({ id: scene.id, module, setLabelRequest: label });
    if (res.error) return;
    let note = null;
    if (withPair && pairable && pairDraft !== paired) {
      const pr = await setPair({ id: scene.id, module, setPairRequest: { paired: pairDraft } });
      if (pr.error) return setPairNote(apiErrorText(pr.error));
      note = pr.data.note; // paired, but nothing was copied: let the user read why
    }
    if (pairable && (withPair ? pairDraft : paired)) {
      const pl = await save({ id: scene.id, module: partnerOf(module), setLabelRequest: label });
      if (pl.error) return setPairNote(apiErrorText(pl.error));
    }
    if (note) return setPairNote(note);
    onClose();
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
        {pairable && <PairSection module={module} paired={paired} draft={pairDraft} onChange={setPairDraft} disabled={!scene || busy} />}
        {saveState.error && <div className="midi-note midi-note-error">{apiErrorText(saveState.error)}</div>}
        {pairNote && (
          <div className="midi-note midi-note-error" role="status">
            {pairNote}
          </div>
        )}
        <div className="dialog-actions">
          <button type="button" className="scene-btn" onClick={() => submit({ name: "", color: null }, { withPair: false })} disabled={busy || !current}>
            Reset
          </button>
          <span style={{ flex: 1 }} />
          <button type="button" className="scene-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="scene-btn scene-btn-primary" disabled={busy}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

/** Stereo-pair switch (C1+C2, C3+C4 …): only a draft, applied by the dialog's Save. */
function PairSection({ module, paired, draft, onChange, disabled }) {
  const odd = oddOf(module);
  const names = `C ${odd + 1} + C ${odd + 2}`;
  let help;
  if (draft && !paired)
    help = `On Save: C ${odd + 2} takes the settings of C ${odd + 1} (left/right) and both get this name; then every change applies to both.`;
  else if (!draft && paired) help = "On Save: the channels become independent again (their settings stay as they are).";
  else if (draft) help = "Every change on one channel also applies to the other; pan is mirrored (left/right). The name applies to both.";
  else help = `Links ${names} as left/right. Nothing changes until you press Save.`;

  return (
    <div className="pair-section">
      <button
        type="button"
        className={`pc-toggle${draft ? " on" : ""}`}
        aria-pressed={draft}
        disabled={disabled}
        onClick={() => onChange(!draft)}
      >
        <span className="pc-toggle-led" aria-hidden="true" />
        Stereo pair {names}
      </button>
      <p className="pair-help">{help}</p>
    </div>
  );
}

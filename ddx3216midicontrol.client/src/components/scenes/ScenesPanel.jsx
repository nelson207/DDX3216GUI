import { useState } from "react";
import { useSelector } from "react-redux";
import {
  useDeleteApiScenesByIdMutation,
  useGetApiScenesQuery,
  usePostApiScenesByIdActivateMutation,
  usePostApiScenesByIdCaptureMutation,
  usePostApiScenesMutation,
  usePutApiScenesByIdMutation,
} from "../../router/apis/MidiApi";
import { useCurrentUser } from "../../router/useAuth";
import { apiErrorText } from "../../functions/ApiErrors";
import Sheet from "../common/Sheet";
import ConfirmButton from "../common/ConfirmButton";

const when = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

/** Small status line: last action result or error */
function useNotice() {
  const [notice, setNotice] = useState(null);
  return {
    notice,
    ok: (text) => setNotice({ kind: "ok", text }),
    fail: (error) => setNotice({ kind: "error", text: apiErrorText(error) }),
    clear: () => setNotice(null),
  };
}

function SceneRow({ scene, canOperate, notice }) {
  const [expanded, setExpanded] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(scene.name);
  const [activate, activateState] = usePostApiScenesByIdActivateMutation();
  const [capture, captureState] = usePostApiScenesByIdCaptureMutation();
  const [rename, renameState] = usePutApiScenesByIdMutation();
  const [remove, removeState] = useDeleteApiScenesByIdMutation();
  const busy = activateState.isLoading || captureState.isLoading || renameState.isLoading || removeState.isLoading;
  const hasParams = scene.parameterCount > 0;

  const run = async (promise, okText) => {
    const res = await promise;
    if (res.error) notice.fail(res.error);
    else notice.ok(typeof okText === "function" ? okText(res.data) : okText);
  };

  return (
    <li className={`scene-row${scene.isActive ? " active" : ""}`}>
      <div className="scene-row-main">
        <div className="scene-row-text">
          <div className="scene-name">
            {scene.name}
            {scene.isActive && <span className="scene-badge">Active</span>}
          </div>
          <div className="scene-meta">
            {scene.labelCount} fader name{scene.labelCount === 1 ? "" : "s"} ·{" "}
            {hasParams
              ? `mixer saved ${when(scene.parametersCapturedAt)} (${scene.parameterCount} values)`
              : "names only"}
          </div>
        </div>
        {canOperate && (
          <button
            type="button"
            className="scene-more"
            aria-expanded={expanded}
            aria-label={`More actions for ${scene.name}`}
            onClick={() => setExpanded((x) => !x)}
          >
            ⋯
          </button>
        )}
      </div>

      {canOperate && (
        <div className="scene-actions">
          <button
            type="button"
            className="scene-btn"
            disabled={busy || scene.isActive}
            onClick={() =>
              run(activate({ id: scene.id, activateSceneRequest: { mode: "labels" } }), `"${scene.name}" is active (names only).`)
            }
          >
            Load names
          </button>
          <ConfirmButton
            className="scene-btn scene-btn-primary"
            disabled={busy || !hasParams}
            confirmLabel={`Send ${scene.parameterCount} values to the console?`}
            onConfirm={() =>
              run(
                activate({ id: scene.id, activateSceneRequest: { mode: "all" } }),
                (d) => `"${scene.name}" loaded: sending ${d.parametersSent} values to the console${d.estimatedSeconds >= 1 ? ` (~${Math.ceil(d.estimatedSeconds)} s)` : ""}.`,
              )
            }
          >
            Load names + mixer
          </ConfirmButton>
        </div>
      )}

      {canOperate && expanded && (
        <div className="scene-extra">
          {renaming ? (
            <form
              className="scene-rename"
              onSubmit={async (e) => {
                e.preventDefault();
                await run(rename({ id: scene.id, renameSceneRequest: { name } }), "Scene renamed.");
                setRenaming(false);
              }}
            >
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={64} autoFocus aria-label="Scene name" />
              <button type="submit" className="scene-btn" disabled={busy || !name.trim()}>
                Save
              </button>
              <button type="button" className="scene-btn" onClick={() => setRenaming(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <button type="button" className="scene-btn" onClick={() => setRenaming(true)} disabled={busy}>
              Rename
            </button>
          )}
          <ConfirmButton
            className="scene-btn"
            disabled={busy}
            confirmLabel={hasParams ? "Overwrite saved mixer?" : "Save the current mixer?"}
            onConfirm={() => run(capture({ id: scene.id }), (d) => `Saved ${d.parametersCaptured} mixer values into "${scene.name}".`)}
          >
            Save current mixer here
          </ConfirmButton>
          <ConfirmButton
            className="scene-btn scene-btn-danger"
            disabled={busy}
            confirmLabel="Delete for good?"
            onConfirm={() => run(remove({ id: scene.id }), `"${scene.name}" deleted.`)}
          >
            Delete
          </ConfirmButton>
        </div>
      )}
    </li>
  );
}

function NewSceneForm({ activeId, notice }) {
  const [name, setName] = useState("");
  const [copyNames, setCopyNames] = useState(true);
  const [captureMixer, setCaptureMixer] = useState(true);
  const [create, createState] = usePostApiScenesMutation();

  return (
    <form
      className="scene-new"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await create({
          createSceneRequest: {
            name,
            captureParameters: captureMixer,
            copyLabelsFromSceneId: copyNames ? activeId : null,
          },
        });
        if (res.error) notice.fail(res.error);
        else {
          notice.ok(
            captureMixer && res.data.parameterCount === 0
              ? `Scene "${res.data.name}" created with names only: no mixer values are known yet (move faders or connect MIDI IN first).`
              : `Scene "${res.data.name}" created.`,
          );
          setName("");
        }
      }}
    >
      <h3>New scene</h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Scene name, e.g. Sunday service"
        maxLength={64}
        aria-label="New scene name"
      />
      <label className="scene-check">
        <input type="checkbox" checked={copyNames} onChange={(e) => setCopyNames(e.target.checked)} />
        Copy fader names and stereo pairs from the active scene
      </label>
      <label className="scene-check">
        <input type="checkbox" checked={captureMixer} onChange={(e) => setCaptureMixer(e.target.checked)} />
        Save the current mixer values
      </label>
      <button type="submit" className="scene-btn scene-btn-primary" disabled={createState.isLoading || !name.trim()}>
        Create scene
      </button>
    </form>
  );
}

export default function ScenesPanel({ open, onClose }) {
  const { canOperate } = useCurrentUser();
  const active = useSelector((s) => s.ws.scene);
  const { data: scenes = [], isLoading, error } = useGetApiScenesQuery(undefined, { skip: !open });
  const notice = useNotice();

  return (
    <Sheet open={open} onClose={() => { notice.clear(); onClose(); }} title="Scenes">
      <div className="scene-current">
        <div className="scene-current-label">Active for everyone</div>
        <div className="scene-current-name">{active?.name ?? "—"}</div>
        <div className="scene-meta">
          Fader names come from the active scene. The console doesn't report its own scene, so load the
          matching scene here when you change it on the desk.
        </div>
      </div>

      {notice.notice && (
        <div className={`midi-note ${notice.notice.kind === "ok" ? "scene-note-ok" : "midi-note-error"}`} role="status">
          {notice.notice.text}
        </div>
      )}
      {error && <div className="midi-note midi-note-error">{apiErrorText(error)}</div>}

      <ul className="scene-list">
        {isLoading && <li className="midi-empty">Loading…</li>}
        {scenes.map((s) => (
          <SceneRow key={s.id} scene={s} canOperate={canOperate} notice={notice} />
        ))}
      </ul>

      {canOperate ? (
        <NewSceneForm activeId={active?.id ?? null} notice={notice} />
      ) : (
        <div className="midi-empty">Your account is read-only: ask an operator to change scenes.</div>
      )}
    </Sheet>
  );
}

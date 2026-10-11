import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  MidiApi,
  useDeleteApiUsersByIdMutation,
  useGetApiUsersQuery,
  usePostApiAuthLogoutMutation,
  usePostApiAuthPasswordMutation,
  usePostApiUsersMutation,
  usePutApiUsersByIdMutation,
} from "../../router/apis/MidiApi";
import { Roles, useCurrentUser } from "../../router/useAuth";
import { wsReset } from "../../router/slices/wsSlice";
import { apiErrorText } from "../../functions/ApiErrors";
import Sheet from "../common/Sheet";
import ConfirmButton from "../common/ConfirmButton";

const ROLE_HELP = {
  Admin: "Everything, including users",
  Operator: "Mixer, MIDI, scenes and fader names",
  Viewer: "Read-only",
};

function Note({ state }) {
  if (!state) return null;
  return (
    <div className={`midi-note ${state.ok ? "scene-note-ok" : "midi-note-error"}`} role="status">
      {state.text}
    </div>
  );
}

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [note, setNote] = useState(null);
  const [change, state] = usePostApiAuthPasswordMutation();
  return (
    <form
      className="account-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await change({ changePasswordRequest: { currentPassword: current, newPassword: next } });
        if (res.error) setNote({ ok: false, text: apiErrorText(res.error) });
        else {
          setNote({ ok: true, text: "Password changed. Other devices have to sign in again." });
          setCurrent("");
          setNext("");
        }
      }}
    >
      <h3>Change password</h3>
      <input type="password" autoComplete="current-password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      <input type="password" autoComplete="new-password" placeholder="New password (min. 6)" value={next} onChange={(e) => setNext(e.target.value)} minLength={6} required />
      <button type="submit" className="scene-btn" disabled={state.isLoading}>
        Change password
      </button>
      <Note state={note} />
    </form>
  );
}

function UserRow({ u, isSelf, onNote }) {
  const [update, updateState] = usePutApiUsersByIdMutation();
  const [remove, removeState] = useDeleteApiUsersByIdMutation();
  const [resetting, setResetting] = useState(false);
  const [password, setPassword] = useState("");
  const busy = updateState.isLoading || removeState.isLoading;

  const run = async (promise, ok) => {
    const res = await promise;
    onNote(res.error ? { ok: false, text: apiErrorText(res.error) } : { ok: true, text: ok });
    return !res.error;
  };

  return (
    <li className="user-row">
      <div className="user-row-main">
        <div className="user-name">
          {u.userName}
          {isSelf && <span className="scene-badge">You</span>}
        </div>
        <select
          className="pc-select"
          aria-label={`Role of ${u.userName}`}
          value={u.role}
          disabled={busy}
          onChange={(e) => run(update({ id: u.id, updateUserRequest: { role: e.target.value } }), `${u.userName} is now ${e.target.value}.`)}
        >
          {Object.values(Roles).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="scene-actions">
        {resetting ? (
          <form
            className="scene-rename"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run(update({ id: u.id, updateUserRequest: { password } }), `Password of ${u.userName} reset.`)) {
                setResetting(false);
                setPassword("");
              }
            }}
          >
            <input type="password" autoComplete="new-password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoFocus />
            <button type="submit" className="scene-btn" disabled={busy}>Save</button>
            <button type="button" className="scene-btn" onClick={() => setResetting(false)}>Cancel</button>
          </form>
        ) : (
          <button type="button" className="scene-btn" onClick={() => setResetting(true)} disabled={busy}>
            Reset password
          </button>
        )}
        {!isSelf && (
          <ConfirmButton
            className="scene-btn scene-btn-danger"
            disabled={busy}
            confirmLabel={`Delete ${u.userName}?`}
            onConfirm={() => run(remove({ id: u.id }), `${u.userName} deleted.`)}
          >
            Delete
          </ConfirmButton>
        )}
      </div>
    </li>
  );
}

function Users({ selfId }) {
  const { data: users = [], error } = useGetApiUsersQuery();
  const [create, createState] = usePostApiUsersMutation();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(Roles.Operator);
  const [note, setNote] = useState(null);

  return (
    <section className="account-section">
      <h3>Users</h3>
      <Note state={note} />
      {error && <div className="midi-note midi-note-error">{apiErrorText(error)}</div>}
      <ul className="scene-list">
        {users.map((u) => (
          <UserRow key={u.id} u={u} isSelf={u.id === selfId} onNote={setNote} />
        ))}
      </ul>
      <form
        className="account-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await create({ createUserRequest: { userName, password, role } });
          if (res.error) setNote({ ok: false, text: apiErrorText(res.error) });
          else {
            setNote({ ok: true, text: `User ${res.data.userName} added.` });
            setUserName("");
            setPassword("");
          }
        }}
      >
        <h3>Add user</h3>
        <input placeholder="User name" autoCapitalize="none" value={userName} onChange={(e) => setUserName(e.target.value)} required />
        <input type="password" autoComplete="new-password" placeholder="Password (min. 6)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        <select className="pc-select" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          {Object.values(Roles).map((r) => (
            <option key={r} value={r}>
              {r} — {ROLE_HELP[r]}
            </option>
          ))}
        </select>
        <button type="submit" className="scene-btn scene-btn-primary" disabled={createState.isLoading}>
          Add user
        </button>
      </form>
    </section>
  );
}

export default function AccountPanel({ open, onClose }) {
  const { user, isAdmin } = useCurrentUser();
  const dispatch = useDispatch();
  const [logout, logoutState] = usePostApiAuthLogoutMutation();

  const signOut = async () => {
    await logout();
    dispatch(wsReset());
    dispatch(MidiApi.util.resetApiState()); // drops cached data; auth state is fetched again -> login screen
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Account"
      footer={
        <button type="button" className="midi-refresh" onClick={signOut} disabled={logoutState.isLoading}>
          Sign out
        </button>
      }
    >
      <div className="scene-current">
        <div className="scene-current-label">Signed in as</div>
        <div className="scene-current-name">{user?.userName}</div>
        <div className="scene-meta">
          {user?.role} · {ROLE_HELP[user?.role]}
        </div>
      </div>
      <ChangePassword />
      {isAdmin && <Users selfId={user?.id} />}
    </Sheet>
  );
}

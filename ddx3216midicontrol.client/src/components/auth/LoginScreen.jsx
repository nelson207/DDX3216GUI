import { useState } from "react";
import headerLogoUrl from "../../assets/header-logo-behringer.svg";
import { usePostApiAuthLoginMutation, usePostApiAuthSetupMutation } from "../../router/apis/MidiApi";
import { apiErrorText } from "../../functions/ApiErrors";

/** Login, or first-run creation of the admin account when the server has no users yet. */
export default function LoginScreen({ setup }) {
  const [userName, setUserName] = useState(setup ? "admin" : "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState(null);
  const [login, loginState] = usePostApiAuthLoginMutation();
  const [createAdmin, setupState] = usePostApiAuthSetupMutation();
  const busy = loginState.isLoading || setupState.isLoading;
  const error = localError ?? apiErrorText(setup ? setupState.error : loginState.error);

  const submit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (setup && password !== confirm) {
      setLocalError("Passwords don't match.");
      return;
    }
    const loginRequest = { userName: userName.trim(), password };
    // success invalidates the auth state; the app replaces this screen
    if (setup) await createAdmin({ loginRequest });
    else await login({ loginRequest });
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <img src={headerLogoUrl} alt="Behringer" className="login-logo" />
        <h1>{setup ? "Create the admin account" : "DDX3216 Remote"}</h1>
        {setup && (
          <p className="login-hint">
            First start: this account can control the mixer and add other users.
          </p>
        )}

        <label className="login-field">
          <span>User name</span>
          <input
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            autoFocus={!setup}
          />
        </label>
        <label className="login-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete={setup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={setup ? 6 : undefined}
            autoFocus={setup}
          />
        </label>
        {setup && (
          <label className="login-field">
            <span>Repeat password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </label>
        )}

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <button type="submit" className="login-submit" disabled={busy}>
          {busy && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
          {setup ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

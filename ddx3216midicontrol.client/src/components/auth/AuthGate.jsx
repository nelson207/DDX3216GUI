import { useAuthState } from "../../router/useAuth";
import LoginScreen from "./LoginScreen";

/**
 * Shows the login (or first-run setup) screen until a user is logged in.
 * Children (the mixer + WebSocket connection) only mount for a logged-in user,
 * so logging out also closes the connection.
 */
export default function AuthGate({ children }) {
  const { loading, error, refetch, setupRequired, user } = useAuthState();

  if (loading) {
    return (
      <div className="login-page">
        <span className="spinner-border text-light" role="status" aria-label="Loading" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Can't reach the server</h1>
          <p className="login-hint">Check that the DDX3216 server is running and on the same network.</p>
          <button type="button" className="login-submit" onClick={refetch}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen setup={setupRequired} />;

  // key: a different user gets a fresh app (state, connection)
  return <div key={user.id} style={{ display: "contents" }}>{children}</div>;
}

import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import headerLogoUrl from "../../assets/header-logo-behringer.svg";
import { DDX_VIEW_RANGES } from "../../domain/ddxViewRanges";
import { useCurrentUser } from "../../router/useAuth";
import MidiSettingsPanel, { MidiButton } from "./MidiSettingsPanel";
import ScenesPanel from "../scenes/ScenesPanel";
import AccountPanel from "../account/AccountPanel";
import ViewSwitcher from "./ViewSwitcher";

export default function TopNavBar({ activeView, setActiveView }) {
  const [panel, setPanel] = useState(null); // "midi" | "scenes" | "account"
  const close = useCallback(() => setPanel(null), []);
  const toggle = (name) => setPanel((p) => (p === name ? null : name));
  const sceneName = useSelector((s) => s.ws.scene?.name);
  const { user, canOperate } = useCurrentUser();

  return (
    <>
      <nav className="topbar">
        <img src={headerLogoUrl} className="topbar-logo" alt="Behringer" />

        {/* phones / small tablets: one labelled switcher instead of squeezed tabs (CSS picks one) */}
        <ViewSwitcher activeView={activeView} setActiveView={setActiveView} />

        <div className="topbar-tabs" role="tablist">
          {Object.entries(DDX_VIEW_RANGES).map(([key, { label, short }]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeView === key}
              className={`topbar-tab${activeView === key ? " active" : ""}`}
              onClick={() => setActiveView(key)}
              title={label}
            >
              <span className="d-none d-xl-inline">{label}</span>
              <span className="d-xl-none">{short ?? label}</span>
            </button>
          ))}
        </div>

        <div className="topbar-right">
          {!canOperate && (
            <span className="readonly-badge" title="Your account can't change the mixer">
              View only
            </span>
          )}
          <button
            type="button"
            className="scene-btn-top"
            aria-haspopup="dialog"
            aria-expanded={panel === "scenes"}
            onClick={() => toggle("scenes")}
            title={`Scene: ${sceneName ?? "—"}`}
          >
            <span className="scene-btn-top-label">Scene</span>
            <span className="scene-btn-top-name">{sceneName ?? "—"}</span>
          </button>
          <MidiButton expanded={panel === "midi"} onClick={() => toggle("midi")} />
          <button
            type="button"
            className="account-btn"
            aria-haspopup="dialog"
            aria-expanded={panel === "account"}
            aria-label={`Account: ${user?.userName ?? ""}`}
            title={`${user?.userName ?? ""} (${user?.role ?? ""})`}
            onClick={() => toggle("account")}
          >
            {(user?.userName ?? "?").slice(0, 1).toUpperCase()}
          </button>
        </div>
      </nav>

      <MidiSettingsPanel open={panel === "midi"} onClose={close} />
      <ScenesPanel open={panel === "scenes"} onClose={close} />
      <AccountPanel open={panel === "account"} onClose={close} />
    </>
  );
}

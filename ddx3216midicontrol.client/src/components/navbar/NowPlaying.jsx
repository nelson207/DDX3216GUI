import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Sheet from "../common/Sheet";

const fmt = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Position now: the server sends it at send time, extrapolate from when we received it. */
function usePosition(np, receivedAt) {
  const [now, setNow] = useState(() => Date.now());
  const playing = np?.state === "playing";
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [playing]);
  if (!np) return 0;
  const pos = np.positionMs + (playing ? Math.max(0, now - receivedAt) : 0);
  return np.durationMs > 0 ? Math.min(pos, np.durationMs) : pos;
}

function Cover({ np, className }) {
  const url = np.covers?.[0];
  return url ? (
    <img className={className} src={url} alt="" referrerPolicy="no-referrer" />
  ) : (
    <span className={`${className} np-cover-empty`} aria-hidden="true">
      ♪
    </span>
  );
}

/** Spotify (raspotify on the Pi): top-bar pill + details sheet. Hidden when nothing is playing. */
export default function NowPlaying({ expanded, onToggle, onClose }) {
  const np = useSelector((s) => s.ws.nowPlaying);
  const receivedAt = useSelector((s) => s.ws.nowPlayingAt);
  const position = usePosition(np, receivedAt);
  if (!np) return null;

  const title = np.title ?? "Spotify";
  const artists = np.artists?.join(", ") ?? "";
  const paused = np.state !== "playing";
  const progress = np.durationMs > 0 ? (position / np.durationMs) * 100 : 0;

  return (
    <>
      <button
        type="button"
        className={`np-btn${paused ? " paused" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={expanded}
        onClick={onToggle}
        title={`${paused ? "Paused" : "Playing"} on Spotify: ${title}${artists ? ` – ${artists}` : ""}`}
      >
        <Cover np={np} className="np-btn-cover" />
        <span className="np-btn-text">
          <span className="np-btn-title">{title}</span>
          <span className="np-btn-artist">{paused ? "Paused" : artists}</span>
        </span>
        <span className="np-btn-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
      </button>

      <Sheet open={expanded} onClose={onClose} title="Now playing">
        <div className="np-detail">
          <Cover np={np} className="np-detail-cover" />
          <div className="np-detail-title">{title}</div>
          {artists && <div className="np-detail-artist">{artists}</div>}
          {np.album && <div className="np-detail-album">{np.album}</div>}
          <div className="np-bar" role="progressbar" aria-valuemin={0} aria-valuemax={np.durationMs} aria-valuenow={position}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="np-times">
            <span>{fmt(position)}</span>
            <span className={`np-state${paused ? " paused" : ""}`}>{paused ? "Paused" : "Playing"}</span>
            <span>{np.durationMs > 0 ? fmt(np.durationMs) : ""}</span>
          </div>
          <p className="np-help">
            Spotify on the Pi (raspotify){np.device ? `, controlled from ${np.device}` : ""}. Use the Spotify app to
            change what plays.
          </p>
        </div>
      </Sheet>
    </>
  );
}

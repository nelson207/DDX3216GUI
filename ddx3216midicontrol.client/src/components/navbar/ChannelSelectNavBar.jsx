// Channel number (1..32) or "Main"
const CHANNELS = [...Array.from({ length: 32 }, (_, i) => i + 1), "Main"];

function ChannelSelectNavBar({ selected, onSelect }) {
  return (
    <nav className="subnav-row" aria-label="Channel selector">
      {CHANNELS.map((ch) => (
        <button
          key={ch}
          type="button"
          className={`subnav-btn${selected === ch ? " active" : ""}`}
          aria-pressed={selected === ch}
          onClick={() => onSelect(ch)}
        >
          {ch}
        </button>
      ))}
    </nav>
  );
}

export default ChannelSelectNavBar;

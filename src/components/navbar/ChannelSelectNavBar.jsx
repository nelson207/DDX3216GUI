function ChannelSelectNavBar({ selected, onSelect }) {
  const channels = [...Array.from({ length: 16 }, (_, i) => i + 1), "Main"];

  return (
    <nav
      className="d-flex h-50 w-100 px-2 py-1 gap-1"
      aria-label="Channel selector"
    >
      {channels.map((ch) => (
        <button
          key={ch}
          type="button"
          className={`btn btn-sm flex-fill text-white fw-bold ${
            selected === ch ? "btn-warning" : "btn-outline-secondary"
          }`}
          onClick={() => onSelect(ch)}
        >
          {ch}
        </button>
      ))}
    </nav>
  );
}

export default ChannelSelectNavBar;

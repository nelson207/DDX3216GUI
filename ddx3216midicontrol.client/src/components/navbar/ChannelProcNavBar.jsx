function ChannelProcNavBar({ selected, onSelect }) {
  const processors = [
    "EQ",
    "Compressor",
    "Gate",
    "Delay",
    "Routing",
    "Aux",
    "Fx",
  ];

  return (
    <nav
      className="d-flex h-50 w-100 px-2 py-1 gap-1"
      aria-label="Channel selector"
    >
      {processors.map((processor) => (
        <button
          key={processor}
          type="button"
          className={`btn btn-sm flex-fill text-white fw-bold ${
            selected === processor
              ? "btn-channel-selected"
              : "btn-outline-secondary"
          }`}
          onClick={() => onSelect(processor)}
        >
          {processor}
        </button>
      ))}
    </nav>
  );
}

export default ChannelProcNavBar;

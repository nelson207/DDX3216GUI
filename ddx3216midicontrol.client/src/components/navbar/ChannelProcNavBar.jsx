const PROCESSORS = ["EQ", "Compressor", "Gate", "Delay", "Routing", "Aux", "Fx"];

function ChannelProcNavBar({ selected, onSelect }) {
  return (
    <nav className="subnav-row" aria-label="Processor selector">
      {PROCESSORS.map((processor) => (
        <button
          key={processor}
          type="button"
          className={`subnav-btn subnav-btn-wide${
            selected === processor ? " active" : ""
          }`}
          aria-pressed={selected === processor}
          onClick={() => onSelect(processor)}
        >
          {processor}
        </button>
      ))}
    </nav>
  );
}

export default ChannelProcNavBar;

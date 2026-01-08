import { useState } from "react";

function PanControl() {

    const [pan, setPan] = useState(0);

     // optional: double-click to snap to center
    const snapCenter = () => setPan(0);

    const panLabel =
        pan === 0 ? "C" : pan < 0 ? `L${Math.abs(pan)}` : `R${pan}`;

    return (
        <div className="d-flex flex-column gap-2">
            <div className="d-flex justify-content-between small text-muted px-1">
                <span className="pan-readout"><b>L</b></span>
                <input
                    type="range"
                    className="form-range pan-slider"
                    min={-100}
                    max={100}
                    step={1}
                    value={pan}
                    onChange={(e) => setPan(parseInt(e.target.value, 10))}
                    onDoubleClick={snapCenter}
                    aria-label="Pan"
                    aria-valuemin={-100}
                    aria-valuemax={100}
                    aria-valuenow={pan}
                />
                <span className="pan-readout"><b>R</b></span>
            </div>

            <div className="text-center fw-medium pan-readout"><b>{panLabel}</b></div>
        </div>
    );
}

export default PanControl;
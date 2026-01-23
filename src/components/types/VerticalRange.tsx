import React, { useId } from "react";

type VerticalRangeProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  /** Container height. Use "100%" to fill parent. */
  height?: number | string;
  /** Container width. Use "100%" to fill parent. */
  width?: number | string;
  bottomToTop?: boolean;

  /** 0..1 fraction of the fader height used as thumb height */
  thumbHeightRatio?: number;
  /** optical Y shift for the SVG inside the thumb (px, can be negative) */
  thumbSvgShiftPx?: number;
};

export function VerticalRange({
  thumbHeightRatio = 0.14,
  thumbSvgShiftPx = 0,
  style,
  className,
  id,
  ...rest
}: VerticalRangeProps) {
  const autoId = useId();
  const inputId = id ?? `vr-${autoId}`;
  const height = "85cqh";
  const width = "100cqw";

  const containerStyle: React.CSSProperties = {
    containerType: "size",
    position: "relative",
    display: "inline-flex",
    width: width, // after rotation, this maps to container height
    height: height, // maps to container width
    top: "7%",
    alignItems: "center",
    justifyContent: "center",
    touchAction: "none",

    // CSS vars (keep as strings so % works)
    ["--vr-h" as any]:
      typeof height === "number" ? `${height}px` : String(height),
    ["--vr-w" as any]: typeof width === "number" ? `${width}px` : String(width),
    ["--thumb-h-ratio" as any]: String(thumbHeightRatio),
    ["--thumb-svg-shift" as any]: `${thumbSvgShiftPx}px`,

    ...style,
  };

  // Use 100% so it adapts to container size (works with % and flex sizing)
  const inputStyle: React.CSSProperties = {
    position: "absolute",
    marginBottom: "50px",
    width: "100cqh", // after rotation, this maps to container height
    height: "100cqw", // maps to container width
    transform: `rotate(-90deg)`,
  };

  return (
    <div style={containerStyle}>
      <input
        id={inputId}
        type="range"
        className={`vertical-range ${className ?? ""}`}
        style={inputStyle}
        {...rest}
      />
    </div>
  );
}

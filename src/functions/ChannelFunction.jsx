export function buildFadersForView(activeView) {
  // Helper to create an item
  const item = (label, channelIndex) => ({ label, channelIndex });

  // 1) Channel views
  if (activeView === "ch1_16") {
    return Array.from(
      { length: 16 },
      (_, i) => item(`Ch ${i + 1}`, i) // 1–16 → indices 0–15
    );
  }

  if (activeView === "ch17_32") {
    return Array.from(
      { length: 16 },
      (_, i) => item(`Ch ${i + 17}`, i + 16) // 17–32 → indices 16–31
    );
  }

  // 2) Bus view: Bus 1..16 mapped to indices 32..47
  if (activeView === "ch33_49" || activeView === "bus1_16") {
    return Array.from({ length: 16 }, (_, i) => item(`Bus ${i + 1}`, 32 + i));
  }

  // 3) “Higher” view: Aux + FX Send + FX Return
  // Adjust base indices if your protocol uses different ones.
  if (activeView === "ch50_66" || activeView === "aux_fx") {
    const auxBase = 48; // Aux 1..4 => 48..51
    const fxSendBase = 52; // Fx Send 1..4 => 52..55
    const fxReturnBase = 56; // Fx Return 1..4 => 56..64

    return [
      ...Array.from({ length: 4 }, (_, i) => item(`Aux ${i + 1}`, auxBase + i)),
      ...Array.from({ length: 4 }, (_, i) =>
        item(`Fx Send ${i + 1}`, fxSendBase + i)
      ),
      ...Array.from({ length: 8 }, (_, i) => {
        const fxNumber = Math.floor(i / 2) + 1;
        const side = i % 2 === 0 ? "L" : "R";
        return item(`Fx Ret ${fxNumber}${side}`, fxReturnBase + i);
      }),
    ];
  }

  // Default fallback
  return Array.from({ length: 32 }, (_, i) => item(`Ch ${i + 1}`, i));
}

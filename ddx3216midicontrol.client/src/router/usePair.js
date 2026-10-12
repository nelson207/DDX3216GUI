import { shallowEqual, useSelector } from "react-redux";

// Stereo pairs: input channels only (C1..C32 = modules 0..31), odd channel + the next one.
export const PAIRABLE_CHANNELS = 32;
export const isPairable = (module) => module >= 0 && module < PAIRABLE_CHANNELS;
export const oddOf = (module) => module & ~1;
export const partnerOf = (module) => module ^ 1;

/**
 * Pairing of a channel in the active scene, or null when it isn't paired.
 * side: "L" for the odd channel (C1), "R" for the even one (C2).
 */
export function usePair(module) {
  return useSelector((s) => {
    if (!isPairable(module)) return null;
    const odd = oddOf(module);
    if (!s.ws.scene?.pairs?.[odd]) return null;
    return { odd, partner: partnerOf(module), side: module === odd ? "L" : "R" };
  }, shallowEqual);
}

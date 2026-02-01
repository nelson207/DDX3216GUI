export const DDX_VIEW_RANGES = {
  ch1_16: {
    label: "Channel 1-16",
    start: 0,
    count: 16,
    showPan: true,
    showMute: true,
  },
  ch17_32: {
    label: "Channel 17-32",
    start: 16,
    count: 16,
    showPan: true,
    showMute: true,
  },
  bus1_16: {
    label: "BUS Out 1-16",
    start: 32,
    count: 16,
    showPan: true,
    showMute: true,
  },
  aux_fx: {
    label: "AUX/FX",
    start: 48,
    count: 16,
    showPan: false,
    showMute: false,
  },
  ch_proc: { label: "Processing", start: 0, count: 0 },
  ch_fx: { label: "FX", start: 0, count: 0 },
};

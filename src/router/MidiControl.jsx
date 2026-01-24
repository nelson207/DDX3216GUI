import { useState, useEffect } from "react";
/********************
 * Utilities
 ********************/
const MFR_ID = [0x00, 0x20, 0x32]; // Behringer manufacturer ID
const DEFAULT_APPARATUS_ID = 0x0b; // DDX3216 "device type"

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function isBehringerDdXSysEx(data) {
  // data is Uint8Array
  return (
    data?.length >= 6 &&
    data[0] === 0xf0 &&
    data[1] === 0x00 &&
    data[2] === 0x20 &&
    data[3] === 0x32
  );
}

export function decodeDdXParamChange(data) {
  // Returns null if not a param-change style message
  // Format (your builder): F0 00 20 32 ic apparatusId func nn [module param hi lo]... F7
  if (!isBehringerDdXSysEx(data)) return null;
  if (data[data.length - 1] !== 0xf7) return null;

  const ic = data[4];
  const apparatusId = data[5];
  const func = data[6];
  const nn = data[7];

  // your param-change func is 0x20
  if ((func & 0x3f) !== 0x20) return null;

  const changes = [];
  let idx = 8;
  for (let i = 0; i < nn; i++) {
    const module = data[idx++] & 0x7f;
    const param = data[idx++] & 0x7f;
    const hi = data[idx++] & 0x7f;
    const lo = data[idx++] & 0x7f;
    const value14 = from14Bit(hi, lo);
    changes.push({ module, param, value14 });
  }

  return { ic, apparatusId, func, nn, changes };
}

export function to14Bit(value) {
  const v = clamp(Math.round(value), 0, 0x3fff);
  return [(v >> 7) & 0x7f, v & 0x7f];
}

function from14Bit(hi, lo) {
  return ((hi & 0x7f) << 7) | (lo & 0x7f);
}

// Format nice hex like "F0 00 20 32 00 ... F7"
export function toHex(bytes) {
  return bytes
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
}

// Parse hex string (spaces/commas OK) → number[]; throws on invalid token
function parseHexString(str) {
  if (!str.trim()) return [];
  return str
    .replace(/[,\n\r\t]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((tok) => {
      const v = parseInt(tok, 16);
      if (Number.isNaN(v) || v < 0 || v > 255)
        throw new Error(`Bad hex byte: ${tok}`);
      return v;
    });
}

/********************
 * MIDI hook
 ********************/
export function useMidi() {
  const [supported, setSupported] = useState(null); // null=unknown, true/false
  const [access, setAccess] = useState(null);
  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      try {
        if (!navigator.requestMIDIAccess) {
          setSupported(false);
          return;
        }
        setSupported(true);
        const acc = await navigator.requestMIDIAccess({ sysex: true });
        setAccess(acc);
        const refresh = () => {
          setInputs(Array.from(acc.inputs.values()));
          setOutputs(Array.from(acc.outputs.values()));
        };
        refresh();
        acc.onstatechange = refresh;
      } catch (e) {
        setError(e?.message || String(e));
      }
    }
    init();
  }, []);

  return { supported, access, inputs, outputs, error };
}

/********************
 * SysEx builder/sender
 ********************/
function buildHeader({ ic, apparatusId }) {
  return [0xf0, ...MFR_ID, ic & 0x7f, apparatusId & 0x7f];
}

function endSysEx(bytes) {
  if (bytes[0] !== 0xf0) throw new Error("SysEx must start with F0");
  return [...bytes, 0xf7];
}

export function packIC({ midiChannel = 1, ignoreFlags = 0 }) {
  // ic: high nibble = flags, low nibble = MIDI channel-1
  // Flags A/B: the spec mentions A=ignore app ID, B=ignore MIDI channel (omni)
  const ch = clamp(midiChannel - 1, 0, 15);
  const flags = ignoreFlags & 0xf0; // allow user to set raw high nibble if wanted
  return (flags | ch) & 0x7f;
}

export function buildParamChange({ ic, apparatusId, changes }) {
  // changes: array of { module, param, value14 }
  const header = buildHeader({ ic, apparatusId });
  const nn = clamp(changes.length, 1, 23);
  const body = [0x20, nn];
  const payload = [];
  for (let i = 0; i < nn; i++) {
    const { module, param, value14 } = changes[i];
    const [hi, lo] = to14Bit(value14);
    payload.push(module & 0x7f, param & 0x7f, hi, lo);
  }

  return endSysEx([...header, ...body, ...payload]);
}

function buildAttenuator({ ic, apparatusId, items }) {
  // items: array of { channelIndex, value14 }
  const header = buildHeader({ ic, apparatusId });
  const nn = clamp(items.length, 1, 23);
  const body = [0x22, nn];
  const payload = [];

  for (let i = 0; i < nn; i++) {
    const { channelIndex, value14 } = items[i];
    const [hi, lo] = to14Bit(value14);
    payload.push(channelIndex & 0x7f, hi, lo);
  }
  return endSysEx([...header, ...body, ...payload]);
}

function buildBlockRequest({
  ic,
  apparatusId,
  what = 0x01,
  blockHi = 0x00,
  blockLo = 0x00,
}) {
  // Minimal example: F0 00 20 32 ic 0B 50 what blockHi blockLo F7
  const header = buildHeader({ ic, apparatusId });
  return endSysEx([
    ...header,
    0x50,
    what & 0x7f,
    blockHi & 0x7f,
    blockLo & 0x7f,
  ]);
}

export function useSender(selectedOut) {
  const [lastSent, setLastSent] = useState(null);
  function send(bytes) {
    if (!selectedOut) throw new Error("Select a MIDI output first.");
    selectedOut.send(bytes);
    setLastSent({ time: new Date(), bytes });
  }
  return { send, lastSent };
}

export function useReceiver(selectedIn, { logRawHex = true } = {}) {
  const [lastMsg, setLastMsg] = useState(null);

  useEffect(() => {
    if (!selectedIn) return;

    const handler = (e) => {
      const data = e.data; // Uint8Array
      const bytes = Array.from(data);

      // Try decode known DDX messages
      const decoded = decodeDdXParamChange(data);

      const decoded2 = decodeCurrentSettingsDump(data);

      const msg = {
        time: new Date(),
        data,
        bytes,
        decoded, // null if not recognized
        decoded2,
        raw: data,
      };

      setLastMsg(msg);
    };

    selectedIn.onmidimessage = handler;

    return () => {
      // clean up
      if (selectedIn.onmidimessage === handler) {
        selectedIn.onmidimessage = null;
      }
    };
  }, [selectedIn, logRawHex]);

  return { lastMsg };
}

// constants for ww (what)
export const F_ALL = 0x00; // <-- confirm your spec's actual values
export const F_SETUP = 0x01;
export const F_CHANL = 0x02;
export const F_SNAPS = 0x07;
// ... etc

export function buildCurrentSettingsRequest({
  ic,
  apparatusId,
  what = F_CHANL,
  block = 0, // 0.. (hh*128+ll)
}) {
  const header = buildHeader({ ic, apparatusId });

  const hh = (block >> 7) & 0x7f;
  const ll = block & 0x7f;

  // 0x50 = "Req Current Settings"
  return endSysEx([...header, 0x50, what & 0x7f, hh, ll]);
}

function depack7bit(packed) {
  const out = [];
  for (let i = 0; i < packed.length; i += 8) {
    const msb = packed[i + 7];
    const block = packed.slice(i, i + 7);
    for (let j = 0; j < block.length; j++) {
      const hi = (msb >> j) & 1;
      out.push(block[j] | (hi << 7));
    }
  }
  return out;
}

export function decodeCurrentSettingsDump(data) {
  if (!isBehringerDdXSysEx(data)) return null;
  if (data[data.length - 1] !== 0xf7) return null;

  const ic = data[4];
  const apparatusId = data[5];
  const func = data[6]; // 0x10 for dump
  if (func !== 0x10) return null;

  const what = data[7]; // <-- IMPORTANT (ww)
  const vv = data[8];

  const totalBlocks = ((data[9] & 0x7f) << 7) | (data[10] & 0x7f);
  const blockIndex = ((data[11] & 0x7f) << 7) | (data[12] & 0x7f);

  const byteCount = data[13] & 0x7f; // 7-bit length

  const payloadStart = 14;
  const payloadEnd = payloadStart + byteCount;

  const packedPayload = Array.from(data.slice(payloadStart, payloadEnd));
  const checksum = data[payloadEnd] & 0x7f;

  const rawPayload = depack7bit(packedPayload);

  return {
    ic,
    apparatusId,
    func,
    what,
    vv,
    totalBlocks,
    blockIndex,
    byteCount,
    checksum,
    rawPayload,
    packedPayload,
  };
}

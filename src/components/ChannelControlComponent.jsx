import { useState, useEffect } from "react";
import FaderControl from "./FaderControlComponent";
import PanControl from "./PanComponent";
import { buildParamChange } from "../router/MidiControl";
import { PARAM_DEFS } from "../domain/ddxParamDefinition";

function ChannelControl({
  channelName,
  channelIndex,
  ic,
  apparatusId,
  sender,
  receiver,
}) {
  const [isMuted, setIsMuted] = useState(false);

  const MUTE_PARAM = PARAM_DEFS.find((p) => p.key === "mute");

  console.log(MUTE_PARAM);

  function setAndSendIsMuted() {
    const changes = [];
    const module = channelIndex;
    changes.push({ module, param: MUTE_PARAM.id, value14: isMuted ? 0 : 1 });
    const bytes = buildParamChange({ ic, apparatusId, changes });
    sender.send(bytes);
    setIsMuted(!isMuted);
  }

  useEffect(() => {
    if (receiver?.decoded) {
      const changes = receiver?.decoded?.changes;
      if (!Array.isArray(changes)) return;

      for (const change of changes) {
        if (change.module === channelIndex) {
          if (change.param === 2) {
            setIsMuted(change.value14 !== 0);
          }
        }
      }
    }
  }, [receiver, channelIndex]);

  return (
    <div className="border border-1">
      <div className="channel p-2">
        <b>{channelName}</b>
      </div>
      <div className="pan p-2">
        <PanControl />
      </div>
      <div
        className="btn-group mutesolo p-2"
        role="group"
        aria-label="Basic example"
        style={{ width: "100%" }}
      >
        <button
          type="button"
          className={`btn ${
            isMuted ? "btn-danger" : "btn-outline-light"
          } mute px-1 mx-1`}
          style={{ width: "50%" }}
          onClick={() => setAndSendIsMuted()}
        >
          {MUTE_PARAM.label}
        </button>
      </div>
      <div className="">
        <FaderControl
          channelIndex={channelIndex}
          ic={ic}
          apparatusId={apparatusId}
          sender={sender}
          receiver={receiver}
        />
      </div>
    </div>
  );
}

export default ChannelControl;

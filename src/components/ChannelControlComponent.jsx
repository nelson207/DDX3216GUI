import { useState, useEffect } from "react";
import FaderControl from "./FaderComponent";
import PanControl from "./PanComponent";
import { buildParamChange } from "../router/MidiControl";

function ChannelControl({
  channelNumber,
  channelIndex,
  ic,
  apparatusId,
  sender,
  receiver,
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isEqOn, setisEqOn] = useState(false);

  function setAndSendIsMuted() {
    const changes = [];
    const module = channelIndex;
    changes.push({ module, param: 2, value14: isMuted ? 0 : 1 });
    const bytes = buildParamChange({ ic, apparatusId, changes });
    sender.send(bytes);
    setIsMuted(!isMuted);
  }

  function setAndSendisEqOn() {
    const changes = [];
    let module = channelIndex;
    changes.push({ module, param: 20, value14: isEqOn ? 0 : 1 });

    const bytes = buildParamChange({ ic, apparatusId, changes });
    sender.send(bytes);
    setisEqOn(!isEqOn);
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
          if (change.param === 20) {
            setisEqOn(change.value14 !== 0);
          }
        }
      }
    }
  }, [receiver, channelIndex]);

  return (
    <div className="border border-1">
      <div className="channel p-2">
        <b>CH {channelNumber}</b>
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
          M
        </button>

        <button
          type="button"
          className={`btn ${
            isEqOn ? "btn-warning" : "btn-outline-light"
          } solo px-1 mx-1`}
          style={{ width: "50%" }}
          onClick={() => setAndSendisEqOn()}
        >
          E
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

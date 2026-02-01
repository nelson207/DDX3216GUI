import { PARAM_DEFS } from "../../domain/ddxParamDefinition";
import { DDX_VIEW_RANGES } from "../../domain/ddxViewRanges";
import { buildFadersForView } from "../../functions/ChannelFunction";
import ParamKindRangeTile from "../control/ParamKindRangeTile";
import ParamKindSwitchTile from "../control/ParamKindSwitchTile";
import FaderRange from "../mixer/FaderRange";

function FadersPanel({ activeView }) {
  const FADERS = buildFadersForView(activeView);
  const PAN_PARAM = PARAM_DEFS.find((p) => p.key === "pan");
  const MUTE_PARAM = PARAM_DEFS.find((p) => p.key === "mute");
  const VOLUME_PARAM = PARAM_DEFS.find((p) => p.key === "volume");

  return (
    <div className="mixer p-0 h-100 w-100 d-flex">
      {FADERS.map(({ label, channelid }) => (
        <div
          id={`f_${channelid}`}
          key={`f_${channelid}`}
          className="channel border border-secondary rounded-3"
        >
          <p className="channel-label mb-2 text-white w-100 text-center fw-bold text-truncate">
            {label}
          </p>
          <div className="pan text-white text-center w-100 mb-2">
            {DDX_VIEW_RANGES[activeView]?.showPan && (
              <ParamKindRangeTile
                def={PAN_PARAM}
                value={PAN_PARAM.defaultRaw}
                componentid={`ch_${String(channelid)}_${PAN_PARAM.key}`}
                channelid={channelid}
                channellabel={label}
                processorid={PAN_PARAM.id}
              />
            )}
          </div>
          <div className="mute text-white text-center w-100 mb-2">
            {DDX_VIEW_RANGES[activeView]?.showMute && (
              <ParamKindSwitchTile
                def={MUTE_PARAM}
                value={MUTE_PARAM.defaultRaw}
                componentid={`ch_${String(channelid)}_${MUTE_PARAM.key}`}
                channelid={channelid}
                channellabel={label}
                processorid={MUTE_PARAM.id}
              />
            )}
          </div>
          <div className="fader-spacer border border-secondary rounded-3 h-100">
            <FaderRange
              def={VOLUME_PARAM}
              value={VOLUME_PARAM.defaultRaw}
              componentid={`ch_${String(channelid)}_${VOLUME_PARAM.key}`}
              channelid={channelid}
              channellabel={label}
              processorid={VOLUME_PARAM.id}
              activeView={activeView}
            ></FaderRange>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FadersPanel;

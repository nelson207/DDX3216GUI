import { PARAM_DEFS } from "../../domain/ddxParamDefinition";
import { DDX_VIEW_RANGES } from "../../domain/ddxViewRanges";
import { buildFadersForView } from "../../functions/ChannelFunction";
import Fader from "../mixer/Fader";
import PanBar from "../mixer/PanBar";
import StripButton from "../mixer/StripButton";

const PAN_PARAM = PARAM_DEFS.find((p) => p.key === "pan");
const MUTE_PARAM = PARAM_DEFS.find((p) => p.key === "mute");
const VOLUME_PARAM = PARAM_DEFS.find((p) => p.key === "volume");
const MAIN_CHANNEL_ID = 64;

function stripKind(channelid) {
  if (channelid === MAIN_CHANNEL_ID) return "main";
  if (channelid < 32) return "input";
  if (channelid < 48) return "bus";
  if (channelid < 52) return "aux";
  return "fx";
}

function Strip({ label, channelid, view }) {
  const common = { channelid, channellabel: label };
  return (
    <div
      id={`f_${channelid}`}
      className={`strip strip-${stripKind(channelid)}`}
    >
      <div className="strip-name" title={label}>
        {label}
      </div>
      <div className="strip-controls">
        {view?.showMute && (
          <StripButton
            {...common}
            def={MUTE_PARAM}
            componentid={`ch_${channelid}_${MUTE_PARAM.key}`}
            processorid={MUTE_PARAM.id}
            variant="mute"
          />
        )}
        {view?.showPan && (
          <PanBar
            {...common}
            def={PAN_PARAM}
            componentid={`ch_${channelid}_${PAN_PARAM.key}`}
            processorid={PAN_PARAM.id}
          />
        )}
      </div>
      <Fader
        {...common}
        def={VOLUME_PARAM}
        componentid={`ch_${channelid}_${VOLUME_PARAM.key}`}
        processorid={VOLUME_PARAM.id}
      />
    </div>
  );
}

function FadersPanel({ activeView }) {
  const faders = buildFadersForView(activeView);
  const view = DDX_VIEW_RANGES[activeView];
  const strips = faders.filter((f) => f.channelid !== MAIN_CHANNEL_ID);
  const master = faders.find((f) => f.channelid === MAIN_CHANNEL_ID);

  return (
    <div className="mixer">
      <div className="mixer-strips">
        {strips.map((f) => (
          <Strip key={`${activeView}_${f.channelid}`} {...f} view={view} />
        ))}
      </div>
      {master && (
        <div className="mixer-master">
          <Strip
            key={`${activeView}_${master.channelid}`}
            {...master}
            view={view}
          />
        </div>
      )}
    </div>
  );
}

export default FadersPanel;

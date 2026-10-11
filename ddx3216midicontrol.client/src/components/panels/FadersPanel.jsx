import { useState } from "react";
import { useSelector } from "react-redux";
import { PARAM_DEFS } from "../../domain/ddxParamDefinition";
import { useCurrentUser } from "../../router/useAuth";
import FaderNameDialog from "../mixer/FaderNameDialog";
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

function Strip({ label: defaultLabel, channelid, view, onRename }) {
  const custom = useSelector((s) => s.ws.scene?.labels?.[channelid]);
  const label = custom?.name || defaultLabel;
  const common = { channelid, channellabel: label };
  const nameStyle = custom?.color ? { background: custom.color } : undefined;
  const title = custom?.name ? `${custom.name} (${defaultLabel})` : defaultLabel;
  return (
    <div
      id={`f_${channelid}`}
      className={`strip strip-${stripKind(channelid)}`}
    >
      {onRename ? (
        <button
          type="button"
          className="strip-name"
          style={nameStyle}
          title={`${title} · tap to rename`}
          onClick={() => onRename(channelid, defaultLabel)}
        >
          {label}
        </button>
      ) : (
        <div className="strip-name" style={nameStyle} title={title}>
          {label}
        </div>
      )}
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
  const { canOperate } = useCurrentUser();
  const [renaming, setRenaming] = useState(null); // { module, defaultName }
  const onRename = canOperate ? (module, defaultName) => setRenaming({ module, defaultName }) : null;
  const faders = buildFadersForView(activeView);
  const view = DDX_VIEW_RANGES[activeView];
  const strips = faders.filter((f) => f.channelid !== MAIN_CHANNEL_ID);
  const master = faders.find((f) => f.channelid === MAIN_CHANNEL_ID);

  return (
    <div className="mixer">
      <div className="mixer-strips">
        {strips.map((f) => (
          <Strip key={`${activeView}_${f.channelid}`} {...f} view={view} onRename={onRename} />
        ))}
      </div>
      {master && (
        <div className="mixer-master">
          <Strip
            key={`${activeView}_${master.channelid}`}
            {...master}
            view={view}
            onRename={onRename}
          />
        </div>
      )}
      {renaming && (
        <FaderNameDialog
          module={renaming.module}
          defaultName={renaming.defaultName}
          onClose={() => setRenaming(null)}
        />
      )}
    </div>
  );
}

export default FadersPanel;

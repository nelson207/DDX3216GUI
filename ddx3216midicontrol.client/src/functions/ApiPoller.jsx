import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetApiMidiDevicesQuery } from "../router/apis/MidiApi";
import { resyncAllParams } from "../router/apis/MidiApiTags";
import { connectWs, disconnectWs } from "../router/websocket/WebSocket";

export function ApiPoller() {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.ws.connected);
  const prevStatusRef = useRef(status);
  const wasConnectedRef = useRef(false);

  const { refetch } = useGetApiMidiDevicesQuery(undefined, {
    skip: status !== true,
  });

  useEffect(() => {
    const prev = prevStatusRef.current;
    const becameOnline = status === true && prev !== true;

    if (becameOnline) {
      refetch();
      // after a drop we may have missed changes: re-read all visible params
      if (wasConnectedRef.current) dispatch(resyncAllParams());
      wasConnectedRef.current = true;
    }

    prevStatusRef.current = status;
  }, [status, refetch, dispatch]);

  useEffect(() => {
    dispatch(connectWs());
    return () => dispatch(disconnectWs());
  }, [dispatch]);

  return null;
}

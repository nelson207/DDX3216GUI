import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetApiMidiDevicesQuery } from "../router/apis/MidiApi";
import { connectWs, disconnectWs } from "../router/websocket/WebSocket";

export function ApiPoller() {
  const status = useSelector((s) => s.ws.connected);
  const prevStatusRef = useRef(status);

  const { refetch } = useGetApiMidiDevicesQuery(undefined, {
    skip: status !== true,
  });

  useEffect(() => {
    const prev = prevStatusRef.current;
    const becameOnline = status === true && prev !== true;

    if (becameOnline) refetch();

    prevStatusRef.current = status;
  }, [status, refetch]);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(connectWs());
    return () => dispatch(disconnectWs());
  }, [dispatch]);

  return null;
}

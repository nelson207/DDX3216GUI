import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendWsJson } from "./websocket/WebSocket";

export function useSender() {
  const dispatch = useDispatch();

  const send = useCallback(
    (changes) => {
      dispatch(sendWsJson(changes));
    },
    [dispatch],
  );

  return {
    send,
  };
}

export function useReceiver() {
  const lastMsg = useSelector((s) => s.ws.lastMessage);
  return {
    lastMsg,
  };
}

import { useDispatch, useSelector } from "react-redux";
import { sendWsJson } from "./websocket/WebSocket";

export function useSender() {
  const dispatch = useDispatch();

  async function send(changes) {
    dispatch(sendWsJson(changes));
  }

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

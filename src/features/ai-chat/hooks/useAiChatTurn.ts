import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ISubscription } from "@microsoft/signalr";
import { useLocation } from "react-router-dom";
import { useAvailableGuides, useGuide } from "@/features/guide/GuideProvider";
import { getAiChatConnection } from "../lib/aiChatHub";
import type { AiChatRequest, AiChatStreamEvent, LiveTurn, PendingGuide } from "../types";
import { chatKeys } from "./useChatRooms";

const CONNECTION_ERROR = "Không kết nối được trợ lý. Bạn thử lại sau nhé.";

const ERROR_TEXT: Record<string, string> = {
  ai_unavailable: "Trợ lý đang tạm nghỉ. Bạn thử lại sau ít phút nhé.",
  llm_unavailable: "Trợ lý đang tạm nghỉ. Bạn thử lại sau ít phút nhé.",
  ai_timeout: "Trợ lý trả lời quá lâu. Bạn hỏi lại giúp mình nhé.",
  room_not_found: "Không tìm thấy cuộc trò chuyện này. Bạn mở cuộc trò chuyện mới nhé.",
};

const GENERIC_ERROR = "Trợ lý chưa trả lời được. Bạn thử lại nhé.";

const QUESTION_NOT_STORED = new Set(["room_not_found"]);

function applyEvent(turn: LiveTurn, event: AiChatStreamEvent): LiveTurn {
  switch (event.type) {
    case "Thinking":
      return { ...turn, thinking: turn.thinking + (event.text ?? "") };
    case "Content":
      return { ...turn, answer: turn.answer + (event.text ?? "") };
    case "RoundReset":
      return { ...turn, thinking: turn.answer ? `${turn.thinking}\n${turn.answer}\n` : turn.thinking, answer: "" };
    case "ToolStarted":
      return { ...turn, status: event.displayText ?? null };
    case "ToolFinished":
      return { ...turn, status: null };
    case "UiAction":
      return { ...turn, guideId: event.guideId ?? turn.guideId };
    case "Error": {
      const code = event.errorCode ?? null;
      return { ...turn, error: (code && ERROR_TEXT[code]) || GENERIC_ERROR, errorCode: code, status: null, done: true };
    }
    case "Done":
      return { ...turn, status: null, done: true };
  }
}

export function useAiChatTurn(roomId: string | null) {
  const queryClient = useQueryClient();
  const runGuide = useGuide();
  const guides = useAvailableGuides();
  const { pathname } = useLocation();
  const [turn, setTurn] = useState<LiveTurn | null>(null);
  const [pendingGuide, setPendingGuide] = useState<PendingGuide | null>(null);
  const subscriptionRef = useRef<ISubscription<AiChatStreamEvent> | null>(null);

  const confirmGuide = useCallback(() => {
    if (!pendingGuide) return;
    runGuide(pendingGuide.guideId, { params: pendingGuide.params });
    setPendingGuide(null);
  }, [pendingGuide, runGuide]);

  const dismissGuide = useCallback(() => setPendingGuide(null), []);

  const reloadRoom = useCallback(
    (targetRoomId: string) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: chatKeys.messages(targetRoomId) }),
        queryClient.invalidateQueries({ queryKey: chatKeys.rooms }),
      ]),
    [queryClient],
  );

  const finish = useCallback(
    async (targetRoomId: string) => {
      subscriptionRef.current = null;
      await reloadRoom(targetRoomId);
      setTurn((current) => {
        if (!current || !current.error) return null;
        return { ...current, persisted: !QUESTION_NOT_STORED.has(current.errorCode ?? "") };
      });
    },
    [reloadRoom],
  );

  const send = useCallback(
    async (targetRoomId: string, question: string) => {
      subscriptionRef.current?.dispose();
      setPendingGuide(null);
      setTurn({ question, thinking: "", answer: "", status: null, guideId: null, error: null, errorCode: null, done: false, persisted: false });

      const request: AiChatRequest = { roomId: targetRoomId, message: question, enableThinking: true, currentRoute: pathname, guides };
      try {
        const connection = await getAiChatConnection();
        subscriptionRef.current = connection.stream<AiChatStreamEvent>("StreamChat", request).subscribe({
          next: (event) => {
            if (event.type === "UiAction" && event.guideId) {
              setPendingGuide({ guideId: event.guideId, params: event.guideParams ?? undefined, messageId: null });
            }
            if (event.type === "Done") {
              setPendingGuide((current) => (current && current.messageId === null ? { ...current, messageId: event.messageId ?? null } : current));
            }
            setTurn((current) => (current ? applyEvent(current, event) : current));
          },
          error: () => {
            setTurn((current) => current && { ...current, error: GENERIC_ERROR, status: null, done: true });
            subscriptionRef.current = null;
          },
          complete: () => void finish(targetRoomId),
        });
      } catch {
        setTurn((current) => current && { ...current, error: CONNECTION_ERROR, done: true });
      }
    },
    [finish, guides, pathname],
  );

  const stop = useCallback(() => {
    subscriptionRef.current?.dispose();
    subscriptionRef.current = null;
    setTurn((current) => current && { ...current, status: null, done: true });
    if (!roomId) return;
    void reloadRoom(roomId).then(() => setTurn((current) => current && { ...current, persisted: true }));
  }, [reloadRoom, roomId]);

  const clear = useCallback(() => {
    setTurn(null);
    setPendingGuide(null);
  }, []);

  useEffect(() => () => subscriptionRef.current?.dispose(), []);

  return { turn, streaming: Boolean(turn && !turn.done), send, stop, clear, pendingGuide, confirmGuide, dismissGuide };
}

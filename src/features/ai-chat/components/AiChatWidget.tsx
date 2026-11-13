import { useEffect, useRef, useState, type FormEvent } from "react";
import { History, MessageCircle, Plus, Send, Square, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/features/auth/AuthContext";
import { useGuide } from "@/features/guide/GuideProvider";
import { env } from "@/lib/env";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/cn";
import { useAiChatTurn } from "../hooks/useAiChatTurn";
import { useGuideOverlap } from "../hooks/useGuideOverlap";
import { useChatMessages, useChatRooms, useCreateRoom, useRollbackMessage } from "../hooks/useChatRooms";
import { closeAiChatConnection } from "../lib/aiChatHub";
import { MAX_MESSAGE_LENGTH, type ChatMessage } from "../types";
import { ChatRoomList } from "./ChatRoomList";
import { LiveMessages, StoredMessage, type GuidePrompt } from "./ChatBubbles";

const ACTIVE_ROOM_KEY = "luminabox.ai-chat.room";
const STICK_THRESHOLD_PX = 80;
const headerButton = "rounded-lg p-1.5 text-primary-soft transition hover:bg-white/10 hover:text-white";

function readActiveRoom(): string | null {
  try {
    return sessionStorage.getItem(ACTIVE_ROOM_KEY);
  } catch {
    return null;
  }
}

function writeActiveRoom(roomId: string | null) {
  try {
    if (roomId) sessionStorage.setItem(ACTIVE_ROOM_KEY, roomId);
    else sessionStorage.removeItem(ACTIVE_ROOM_KEY);
  } catch {
    return;
  }
}

export function AiChatWidget() {
  const { user } = useAuth();
  if (!user || env.useMock) return null;
  return <AiChatPanel key={user.id} />;
}

function AiChatPanel() {
  const toast = useToast();
  const runGuide = useGuide();
  const [open, setOpen] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(readActiveRoom);
  const [draft, setDraft] = useState("");
  const rooms = useChatRooms(open);
  const messages = useChatMessages(open ? roomId : null);
  const createRoom = useCreateRoom();
  const { turn, streaming, send, stop, clear, pendingGuide, confirmGuide, dismissGuide } = useAiChatTurn(roomId);
  const rollback = useRollbackMessage();
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const stickToBottomRef = useRef(true);
  const coveringGuide = useGuideOverlap(panelRef, open);

  const guidePrompt: GuidePrompt | undefined = pendingGuide
    ? { guideId: pendingGuide.guideId, onConfirm: confirmGuide, onDismiss: dismissGuide }
    : undefined;

  const activeRoom = rooms.data?.find((room) => room.id === roomId);

  const selectRoom = (id: string | null) => {
    if (streaming) stop();
    clear();
    setRoomId(id);
    writeActiveRoom(id);
    setShowRooms(false);
  };

  const guideFromChat = (guideId: string) => runGuide(guideId);

  const resendFrom = async (message: ChatMessage, text: string) => {
    if (!roomId || streaming) return;
    try {
      await rollback.mutateAsync({ roomId, messageId: message.id });
    } catch (error) {
      toast.error(errorMessage(error, "Không gửi lại được câu hỏi này."));
      return;
    }
    clear();
    stickToBottomRef.current = true;
    void send(roomId, text);
  };

  useEffect(() => () => void closeAiChatConnection(), []);

  useEffect(() => {
    stickToBottomRef.current = true;
  }, [roomId, open, turn?.question]);

  useEffect(() => {
    const list = listRef.current;
    if (list && stickToBottomRef.current) list.scrollTo({ top: list.scrollHeight });
  }, [messages.data, turn?.answer, turn?.thinking, turn?.status, pendingGuide, open]);

  const trackScroll = () => {
    const list = listRef.current;
    if (list) stickToBottomRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < STICK_THRESHOLD_PX;
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const question = draft.trim();
    if (!question || streaming) return;

    let targetRoomId = roomId;
    if (!targetRoomId) {
      try {
        targetRoomId = (await createRoom.mutateAsync()).id;
        setRoomId(targetRoomId);
        writeActiveRoom(targetRoomId);
      } catch (error) {
        toast.error(errorMessage(error, "Không tạo được cuộc trò chuyện."));
        return;
      }
    }

    setDraft("");
    void send(targetRoomId, question);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          data-guide-label="Trợ lý LuminaBox"
          aria-label="Mở trợ lý LuminaBox"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 grid size-14 place-items-center rounded-full bg-primary text-white shadow-pop transition hover:bg-primary-dark"
        >
          <MessageCircle size={24} />
          {streaming && <span className="absolute right-1 top-1 size-3 animate-pulse rounded-full bg-gold" />}
        </button>
      )}

      {open && (
        <section
          ref={panelRef}
          aria-label="Trợ lý LuminaBox"
          data-guide-ignore
          data-scroll-native
          className={cn(
            "fixed bottom-6 right-6 z-50 flex h-[min(640px,calc(100dvh-2.5rem))] w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-card border border-line bg-cream shadow-pop transition-opacity duration-300",
            coveringGuide ? "pointer-events-none opacity-20" : "lb-fade-in",
          )}
        >
          <header className="flex items-center gap-1 bg-chrome px-3 py-2.5 text-white">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{showRooms ? "Lịch sử trò chuyện" : activeRoom?.title ?? "Trợ lý LuminaBox"}</p>
            <button type="button" aria-label="Lịch sử trò chuyện" aria-pressed={showRooms} className={headerButton} onClick={() => setShowRooms((value) => !value)}>
              <History size={18} />
            </button>
            <button type="button" aria-label="Cuộc trò chuyện mới" className={headerButton} onClick={() => selectRoom(null)}>
              <Plus size={18} />
            </button>
            <button type="button" aria-label="Thu nhỏ trợ lý" className={headerButton} onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </header>

          {showRooms ? (
            <div className="lb-scrollbar min-h-0 flex-1 overflow-y-auto">
              <ChatRoomList activeRoomId={roomId} onSelect={selectRoom} onDeleted={(id) => id === roomId && selectRoom(null)} />
            </div>
          ) : (
            <>
              <div ref={listRef} onScroll={trackScroll} className="lb-scrollbar flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
                {!roomId && !turn && <p className="m-auto text-center text-sm text-ink-muted">Bạn cần mình giúp gì?</p>}
                {messages.isError && <p className="text-center text-sm text-danger">Không tải được tin nhắn.</p>}
                {messages.data?.map((message) => (
                  <StoredMessage
                    key={message.id}
                    message={message}
                    onGuide={guideFromChat}
                    guidePrompt={pendingGuide?.messageId === message.id ? guidePrompt : undefined}
                    onResend={streaming || rollback.isPending ? undefined : resendFrom}
                  />
                ))}
                {turn && <LiveMessages turn={turn} guidePrompt={pendingGuide && pendingGuide.messageId === null ? guidePrompt : undefined} />}
              </div>

              <form onSubmit={submit} className="flex items-end gap-2 border-t border-line bg-card p-2.5">
                <textarea
                  value={draft}
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={1}
                  placeholder="Nhập câu hỏi…"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                  className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-line bg-cream px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-primary"
                />
                {streaming ? (
                  <button type="button" aria-label="Dừng trả lời" onClick={stop} className="grid size-10 place-items-center rounded-lg bg-ink text-white transition hover:opacity-90">
                    <Square size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    aria-label="Gửi"
                    disabled={!draft.trim() || createRoom.isPending}
                    className={cn("grid size-10 place-items-center rounded-lg bg-primary text-white transition hover:bg-primary-dark disabled:opacity-50")}
                  >
                    <Send size={16} />
                  </button>
                )}
              </form>
            </>
          )}
        </section>
      )}
    </>
  );
}

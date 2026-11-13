import { useEffect, useRef, useState, type ReactNode } from "react";
import { Compass, Loader2, RotateCcw } from "lucide-react";
import { GUIDES } from "@/features/guide/guides";
import { cn } from "@/lib/cn";
import { MAX_MESSAGE_LENGTH, type ChatMessage, type LiveTurn } from "../types";
import { ChatText } from "./ChatText";

function UserBubble({ text }: { text: string }) {
  return <div className="whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-white">{text}</div>;
}

function AssistantBubble({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mr-10 self-start rounded-2xl rounded-bl-sm border border-line bg-card px-3.5 py-2 text-sm text-ink", className)}>{children}</div>;
}

function GuideChip({ guideId, onGuide }: { guideId: string; onGuide: (guideId: string) => void }) {
  const label = GUIDES[guideId]?.label;
  if (!label) return null;
  return (
    <button
      type="button"
      onClick={() => onGuide(guideId)}
      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-2.5 py-1 text-xs font-semibold text-primary transition hover:border-primary"
    >
      <Compass size={13} /> {label}
    </button>
  );
}

export interface GuidePrompt {
  guideId: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

function GuideConfirm({ prompt }: { prompt: GuidePrompt }) {
  const label = GUIDES[prompt.guideId]?.label ?? "trang này";
  return (
    <div className="mt-2 rounded-xl border border-primary/30 bg-primary-soft/40 p-2.5">
      <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
        <Compass size={14} className="text-primary" /> Mở trang {label}?
      </p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={prompt.onConfirm} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-dark">
          Mở trang
        </button>
        <button type="button" onClick={prompt.onDismiss} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-cream-dark">
          Để sau
        </button>
      </div>
    </div>
  );
}


function MessageEditor({ initial, onSubmit, onCancel }: { initial: string; onSubmit: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    box.focus();
    box.setSelectionRange(box.value.length, box.value.length);
  }, []);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${box.scrollHeight}px`;
  }, [text]);

  const submit = () => {
    const value = text.trim();
    if (value) onSubmit(value);
    else onCancel();
  };

  return (
    <textarea
      ref={ref}
      value={text}
      rows={1}
      maxLength={MAX_MESSAGE_LENGTH}
      aria-label="Sửa câu hỏi"
      onChange={(e) => setText(e.target.value)}
      onBlur={onCancel}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          submit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      className="lb-scrollbar max-h-40 w-72 max-w-full resize-none rounded-2xl rounded-br-sm border-2 border-primary bg-card px-3.5 py-2 text-sm text-ink outline-none"
    />
  );
}

function StoredUserMessage({ message, onResend }: { message: ChatMessage; onResend?: (message: ChatMessage, text: string) => void }) {
  const [editing, setEditing] = useState(false);

  if (editing && onResend)
    return (
      <div className="ml-10 flex justify-end self-end">
        <MessageEditor
          initial={message.content}
          onCancel={() => setEditing(false)}
          onSubmit={(text) => {
            setEditing(false);
            onResend(message, text);
          }}
        />
      </div>
    );

  return (
    <div className="group ml-10 flex items-start gap-1 self-end">
      {onResend && (
        <button
          type="button"
          aria-label="Sửa và gửi lại câu hỏi này"
          onClick={() => setEditing(true)}
          className="mt-1.5 rounded-md p-1 text-ink-muted opacity-0 transition hover:bg-cream-dark hover:text-ink group-hover:opacity-100 focus:opacity-100"
        >
          <RotateCcw size={14} />
        </button>
      )}
      <UserBubble text={message.content} />
    </div>
  );
}

interface StoredMessageProps {
  message: ChatMessage;
  onGuide: (guideId: string) => void;
  guidePrompt?: GuidePrompt;
  onResend?: (message: ChatMessage, text: string) => void;
}

export function StoredMessage({ message, onGuide, guidePrompt, onResend }: StoredMessageProps) {
  if (message.role === "User") return <StoredUserMessage message={message} onResend={onResend} />;
  return (
    <AssistantBubble>
      {message.content && <ChatText text={message.content} />}
      {guidePrompt ? <GuideConfirm prompt={guidePrompt} /> : message.guideId && <GuideChip guideId={message.guideId} onGuide={onGuide} />}
    </AssistantBubble>
  );
}

function ThinkingBlock({ text, live }: { text: string; live: boolean }) {
  const boxRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (live) boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [text, live]);

  return (
    <details className="mb-1 text-xs text-ink-muted" open={live}>
      <summary className="cursor-pointer select-none font-medium">Đang suy nghĩ</summary>
      <p ref={boxRef} className="lb-scrollbar mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
        {text}
      </p>
    </details>
  );
}

export function LiveMessages({ turn, guidePrompt }: { turn: LiveTurn; guidePrompt?: GuidePrompt }) {
  const waiting = !turn.done && !turn.answer;
  return (
    <>
      {!turn.persisted && (
        <div className="ml-10 self-end">
          <UserBubble text={turn.question} />
        </div>
      )}
      <AssistantBubble className={cn(turn.error && "border-danger/40")}>
        {turn.thinking.trim() && <ThinkingBlock text={turn.thinking.trim()} live={!turn.answer && !turn.done} />}
        {turn.status && (
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Loader2 size={12} className="animate-spin" /> {turn.status}
          </p>
        )}
        {waiting && !turn.status && <Loader2 size={14} className="animate-spin text-ink-muted" />}
        {turn.answer && <ChatText text={turn.answer} />}
        {turn.error && <p className="text-danger">{turn.error}</p>}
        {guidePrompt && <GuideConfirm prompt={guidePrompt} />}
      </AssistantBubble>
    </>
  );
}

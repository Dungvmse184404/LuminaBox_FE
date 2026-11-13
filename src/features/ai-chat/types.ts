import type { GuideOption } from "@/features/guide/guides";

export const MAX_MESSAGE_LENGTH = 4000;

export type ChatRole = "User" | "Assistant";

export interface ChatRoom {
  id: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  guideId: string | null;
  createdAt: string;
}

export type AiChatEventType = "Thinking" | "Content" | "ToolStarted" | "ToolFinished" | "Done" | "Error" | "RoundReset" | "UiAction";

export interface AiChatStreamEvent {
  turnId: string;
  seq: number;
  type: AiChatEventType;
  text?: string | null;
  displayText?: string | null;
  messageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  guideId?: string | null;
  guideParams?: Record<string, string> | null;
}

export interface AiChatRequest {
  roomId: string;
  message: string;
  enableThinking: boolean;
  currentRoute: string;
  guides: GuideOption[];
}

export interface PendingGuide {
  guideId: string;
  params?: Record<string, string>;
  messageId: string | null;
}

export interface LiveTurn {
  question: string;
  thinking: string;
  answer: string;
  status: string | null;
  guideId: string | null;
  error: string | null;
  errorCode: string | null;
  done: boolean;
  persisted: boolean;
}

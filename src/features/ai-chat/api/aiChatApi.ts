import { request } from "@/lib/api";
import type { Paged } from "@/types/api";
import type { ChatMessage, ChatRoom } from "../types";

const ROOMS_PAGE_SIZE = 30;
const MESSAGES_PAGE_SIZE = 50;

export const aiChatApi = {
  rooms: async () => {
    const { data } = await request<Paged<ChatRoom>>("/ai-chat/rooms", { auth: true, query: { page: 1, pageSize: ROOMS_PAGE_SIZE } });
    return data?.items ?? [];
  },

  createRoom: async () => {
    const { data } = await request<ChatRoom>("/ai-chat/rooms", { method: "POST", body: {}, auth: true });
    return data!;
  },

  renameRoom: async (id: string, title: string) => {
    const { data } = await request<ChatRoom>(`/ai-chat/rooms/${id}`, { method: "PUT", body: { title }, auth: true });
    return data!;
  },

  deleteRoom: async (id: string) => {
    await request(`/ai-chat/rooms/${id}`, { method: "DELETE", auth: true });
  },

  rollback: async (roomId: string, messageId: string) => {
    await request(`/ai-chat/rooms/${roomId}/messages/${messageId}/rollback`, { method: "POST", auth: true });
  },

  messages: async (roomId: string) => {
    const { data } = await request<Paged<ChatMessage>>(`/ai-chat/rooms/${roomId}/messages`, {
      auth: true,
      query: { page: 1, pageSize: MESSAGES_PAGE_SIZE },
    });
    return data?.items ?? [];
  },
};

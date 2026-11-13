import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiChatApi } from "../api/aiChatApi";

export const chatKeys = {
  rooms: ["ai-chat", "rooms"] as const,
  messages: (roomId: string) => ["ai-chat", "messages", roomId] as const,
};

export const useChatRooms = (enabled: boolean) => useQuery({ queryKey: chatKeys.rooms, queryFn: aiChatApi.rooms, enabled });

export const useChatMessages = (roomId: string | null) =>
  useQuery({
    queryKey: chatKeys.messages(roomId ?? ""),
    queryFn: () => aiChatApi.messages(roomId!),
    enabled: Boolean(roomId),
  });

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiChatApi.createRoom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.rooms }),
  });
}

export function useRenameRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => aiChatApi.renameRoom(id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.rooms }),
  });
}

export function useRollbackMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, messageId }: { roomId: string; messageId: string }) => aiChatApi.rollback(roomId, messageId),
    onSuccess: (_, { roomId }) => queryClient.invalidateQueries({ queryKey: chatKeys.messages(roomId) }),
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiChatApi.deleteRoom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.rooms }),
  });
}

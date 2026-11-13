import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { ErrorState, SkeletonRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/cn";
import { useChatRooms, useDeleteRoom, useRenameRoom } from "../hooks/useChatRooms";

interface Props {
  activeRoomId: string | null;
  onSelect: (roomId: string) => void;
  onDeleted: (roomId: string) => void;
}

const iconButton = "rounded-md p-1.5 text-ink-muted transition hover:bg-cream-dark hover:text-ink";

export function ChatRoomList({ activeRoomId, onSelect, onDeleted }: Props) {
  const toast = useToast();
  const rooms = useChatRooms(true);
  const rename = useRenameRoom();
  const remove = useDeleteRoom();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const saveTitle = async (id: string) => {
    const title = draft.trim();
    if (!title) return setEditingId(null);
    try {
      await rename.mutateAsync({ id, title });
      setEditingId(null);
    } catch (error) {
      toast.error(errorMessage(error, "Không đổi được tên."));
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      setConfirmingId(null);
      onDeleted(id);
    } catch (error) {
      toast.error(errorMessage(error, "Không xóa được cuộc trò chuyện."));
    }
  };

  if (rooms.isLoading) return <SkeletonRows />;
  if (rooms.isError) return <ErrorState message="Không tải được lịch sử trò chuyện." onRetry={() => rooms.refetch()} />;
  if (!rooms.data?.length) return <p className="p-4 text-center text-sm text-ink-muted">Chưa có cuộc trò chuyện nào.</p>;

  return (
    <ul className="flex flex-col gap-1 p-2">
      {rooms.data.map((room) => (
        <li
          key={room.id}
          className={cn("group flex items-center gap-1 rounded-lg px-2 py-1.5", room.id === activeRoomId ? "bg-primary-soft" : "hover:bg-cream")}
        >
          {editingId === room.id ? (
            <>
              <input
                autoFocus
                value={draft}
                maxLength={100}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveTitle(room.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="min-w-0 flex-1 rounded-md border border-line bg-card px-2 py-1 text-sm outline-none focus:border-primary"
              />
              <button type="button" aria-label="Lưu tên" className={iconButton} onClick={() => void saveTitle(room.id)}>
                <Check size={14} />
              </button>
              <button type="button" aria-label="Hủy đổi tên" className={iconButton} onClick={() => setEditingId(null)}>
                <X size={14} />
              </button>
            </>
          ) : confirmingId === room.id ? (
            <>
              <span className="min-w-0 flex-1 truncate text-sm text-danger">Xóa "{room.title}"?</span>
              <button type="button" data-guide-kind="danger" className="rounded-md px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/10" onClick={() => void deleteRoom(room.id)}>
                Xóa
              </button>
              <button type="button" className="rounded-md px-2 py-1 text-xs font-semibold text-ink-soft hover:bg-cream-dark" onClick={() => setConfirmingId(null)}>
                Không
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => onSelect(room.id)} className="min-w-0 flex-1 truncate text-left text-sm text-ink">
                {room.title}
              </button>
              <button
                type="button"
                aria-label={`Đổi tên ${room.title}`}
                className={cn(iconButton, "opacity-0 group-hover:opacity-100 focus:opacity-100")}
                onClick={() => {
                  setDraft(room.title);
                  setEditingId(room.id);
                }}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                aria-label={`Xóa ${room.title}`}
                data-guide-kind="danger"
                className={cn(iconButton, "opacity-0 hover:text-danger group-hover:opacity-100 focus:opacity-100")}
                onClick={() => setConfirmingId(room.id)}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({ open, title, children, confirmLabel, loading, onConfirm, onClose }: Props) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-ink-soft">{children}</div>
    </Modal>
  );
}

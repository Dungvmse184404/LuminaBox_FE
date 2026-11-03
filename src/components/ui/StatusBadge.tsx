import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const TONES: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  neutral: "bg-cream-dark text-ink-soft",
};

const STATUS_TONE: Record<string, Tone> = {
  Active: "success",
  Approved: "success",
  Delivered: "success",
  Paid: "success",
  Available: "success",
  Visible: "success",
  Pending: "warning",
  AwaitingConfirmation: "warning",
  Confirmed: "info",
  Delivering: "info",
  Rented: "info",
  Hidden: "neutral",
  Inactive: "neutral",
  Expired: "neutral",
  Suspended: "danger",
  Locked: "danger",
  Rejected: "danger",
  Cancelled: "danger",
  Failed: "danger",
  Terminated: "danger",
};

interface Props {
  status: string;
  label?: string;
  tone?: Tone;
}

export function StatusBadge({ status, label, tone }: Props) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", TONES[tone ?? STATUS_TONE[status] ?? "neutral"])}>
      {label ?? status}
    </span>
  );
}

import { Hammer } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/States";

interface Props {
  title: string;
  spec?: string;
}

export function PlaceholderPage({ title, spec }: Props) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState title="Trang chưa được xây dựng" description={spec ? `Đặc tả: ${spec}` : undefined} action={<Hammer size={18} className="text-gold" />} />
    </>
  );
}

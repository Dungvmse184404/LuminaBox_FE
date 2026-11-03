import { Hammer } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/States";

interface Props {
  title: string;
}

export function PlaceholderPage({ title }: Props) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState title="Sắp ra mắt" description="Tính năng này đang được hoàn thiện." action={<Hammer size={18} className="text-gold" />} />
    </>
  );
}

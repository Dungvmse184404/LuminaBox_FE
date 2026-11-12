import type { ComponentType, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import type { LucideProps } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

interface Props {
  code: string;
  title: string;
  description: string;
  icon: ComponentType<LucideProps>;
  actions?: ReactNode;
  detail?: string;
}

export function ErrorPage({ code, title, description, icon: Icon, actions, detail }: Props) {
  const navigate = useNavigate();

  return (
    <Container className="grid min-h-[60vh] place-items-center py-16">
      <div data-error-page={code} className="lb-page-enter flex max-w-md flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
          <Icon size={28} />
        </span>
        <p className="mt-5 font-serif text-6xl font-black tracking-tight text-primary">{code}</p>
        <h1 className="mt-2 font-serif text-xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-soft">{description}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {actions}
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Quay lại
          </Button>
          <Link to="/">
            <Button>
              <Home size={16} />
              Trang chủ
            </Button>
          </Link>
        </div>

        {detail && import.meta.env.DEV && (
          <pre className="lb-scrollbar mt-6 max-h-40 w-full overflow-auto rounded-lg bg-ink p-3 text-left text-xs text-cream">{detail}</pre>
        )}
      </div>
    </Container>
  );
}

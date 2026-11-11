import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { matchPath, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { guideTarget } from "./guides";
import { highlightGuideTarget } from "./highlight";

type RunGuide = (guideId: string, options?: { replace?: boolean }) => boolean;

const GuideContext = createContext<RunGuide | null>(null);

export function GuideProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const stopRef = useRef<(() => void) | null>(null);

  const runGuide = useCallback<RunGuide>(
    (guideId, options) => {
      const node = guideTarget(guideId);
      if (!node || (node.roles && !hasRole(...node.roles))) return false;

      stopRef.current?.();
      const onPage = !node.page || matchPath({ path: node.page, end: true }, window.location.pathname);
      if (!onPage && node.page) navigate(node.page, { replace: options?.replace });
      stopRef.current = highlightGuideTarget(node.id);
      return !onPage;
    },
    [hasRole, navigate],
  );

  useEffect(() => {
    const guideId = searchParams.get("guide");
    if (!guideId) return;
    const navigated = runGuide(guideId, { replace: true });
    if (!navigated) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete("guide");
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams, runGuide]);

  useEffect(() => () => stopRef.current?.(), []);

  return <GuideContext.Provider value={runGuide}>{children}</GuideContext.Provider>;
}

export function useGuide(): RunGuide {
  const run = useContext(GuideContext);
  if (!run) throw new Error("useGuide must be used inside <GuideProvider>");
  return run;
}

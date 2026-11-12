import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { getEffects } from "@/lib/appearance";
import { availableGuides, guideSearch, guideTarget, type GuideOption, type GuideParams } from "./guides";
import { walkMediaQuery } from "./guideConfig";
import { highlightGuideTarget } from "./highlight";
import type { GuideNode } from "./navigationMap";
import { findGuidePath, isOnPage } from "./paths";
import { runGuideWalk } from "./walk";

const GUIDE_QUERY_KEY = "guide";
const GUIDE_PARAM_PREFIX = "guide_";

interface RunGuideOptions {
  replace?: boolean;
  params?: GuideParams;
}

type RunGuide = (guideId: string, options?: RunGuideOptions) => boolean;

const GuideContext = createContext<RunGuide | null>(null);

export function GuideProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const stopRef = useRef<(() => void) | null>(null);

  const runGuide = useCallback<RunGuide>(
    (guideId, options) => {
      const canUse = (node: GuideNode) => !node.excluded && (!node.roles || hasRole(...node.roles));
      const target = guideTarget(guideId);
      if (!target || !canUse(target)) return false;

      stopRef.current?.();

      const search = guideSearch(guideId, options?.params);
      if (search !== null && target.page) {
        navigate({ pathname: target.page, search }, { replace: options?.replace });
        stopRef.current = highlightGuideTarget(target.id);
        return true;
      }

      const jump = (replace?: boolean) => {
        if (target.page && !isOnPage(target.page, window.location.pathname)) navigate(target.page, { replace });
        return highlightGuideTarget(target.id);
      };

      if (window.matchMedia(walkMediaQuery()).matches) {
        const path = findGuidePath(target.id, window.location.pathname, canUse);
        if (path && path.length > 1) {
          stopRef.current = runGuideWalk(path, getEffects().guideCountdown * 1000, () => jump());
          return false;
        }
      }

      const onPage = isOnPage(target.page, window.location.pathname);
      stopRef.current = jump(options?.replace);
      return !onPage;
    },
    [hasRole, navigate],
  );

  useEffect(() => {
    const guideId = searchParams.get(GUIDE_QUERY_KEY);
    if (!guideId) return;

    const params: GuideParams = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith(GUIDE_PARAM_PREFIX)) params[key.slice(GUIDE_PARAM_PREFIX.length)] = value;
    });

    const navigated = runGuide(guideId, { replace: true, params });
    if (!navigated) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          [...next.keys()]
            .filter((key) => key === GUIDE_QUERY_KEY || key.startsWith(GUIDE_PARAM_PREFIX))
            .forEach((key) => next.delete(key));
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

export function useAvailableGuides(): GuideOption[] {
  const { hasRole } = useAuth();
  return useMemo(() => availableGuides(hasRole), [hasRole]);
}

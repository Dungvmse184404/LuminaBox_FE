import { useEffect, useState, type RefObject } from "react";

const ACTIVE_SELECTOR = "[data-guide-active]";
const CHECK_INTERVAL_MS = 250;

function overlaps(a: DOMRect, b: DOMRect) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

export function useGuideOverlap(panelRef: RefObject<HTMLElement | null>, enabled: boolean): boolean {
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setCovered(false);
      return;
    }

    let timer = 0;
    const check = () => {
      const panel = panelRef.current;
      const active = document.querySelector<HTMLElement>(ACTIVE_SELECTOR);
      const hit = Boolean(panel && active && overlaps(panel.getBoundingClientRect(), active.getBoundingClientRect()));
      setCovered(hit);
      if (!active) {
        window.clearInterval(timer);
        timer = 0;
      }
    };
    const watch = () => {
      check();
      if (!timer && document.querySelector(ACTIVE_SELECTOR)) timer = window.setInterval(check, CHECK_INTERVAL_MS);
    };

    const observer = new MutationObserver(watch);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-guide-active"] });
    watch();

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [enabled, panelRef]);

  return covered;
}

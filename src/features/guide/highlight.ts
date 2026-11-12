import { GUIDE_CONFIG } from "./guideConfig";
import { findGuideElement } from "./locate";

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function waitForGuideElement(nodeId: string, timeoutMs: number, signal: AbortSignal): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve(null);
    const existing = findGuideElement(nodeId);
    if (existing) return resolve(existing);

    let pending = 0;
    const observer = new MutationObserver(() => {
      if (pending) return;
      pending = window.setTimeout(() => {
        pending = 0;
        const found = findGuideElement(nodeId);
        if (found) done(found);
      }, GUIDE_CONFIG.checkDelayMs);
    });
    const timer = window.setTimeout(() => done(null), timeoutMs);
    const onAbort = () => done(null);

    function done(element: HTMLElement | null) {
      observer.disconnect();
      window.clearTimeout(pending);
      window.clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      resolve(element);
    }

    signal.addEventListener("abort", onAbort);
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

export function scrollToGuideElement(element: HTMLElement) {
  window.setTimeout(() => {
    element.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, GUIDE_CONFIG.scrollDelayMs);
}

export function markGuideElement(element: HTMLElement): () => void {
  element.setAttribute("data-guide-active", "");

  const ring = document.createElement("div");
  ring.className = "lb-guide-ring";
  ring.setAttribute("aria-hidden", "true");
  const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
  ring.style.borderRadius = `${radius + GUIDE_CONFIG.ringGapPx}px`;
  document.body.appendChild(ring);

  const follow = () => {
    if (!ring.isConnected) return;
    const rect = element.getBoundingClientRect();
    const visible = element.isConnected && rect.width > 0 && rect.height > 0;
    ring.style.display = visible ? "" : "none";
    ring.style.left = `${rect.left - GUIDE_CONFIG.ringGapPx}px`;
    ring.style.top = `${rect.top - GUIDE_CONFIG.ringGapPx}px`;
    ring.style.width = `${rect.width + GUIDE_CONFIG.ringGapPx * 2}px`;
    ring.style.height = `${rect.height + GUIDE_CONFIG.ringGapPx * 2}px`;
    requestAnimationFrame(follow);
  };
  follow();

  return () => {
    ring.remove();
    element.removeAttribute("data-guide-active");
  };
}

export function highlightGuideTarget(nodeId: string): () => void {
  const controller = new AbortController();
  let unmark: (() => void) | null = null;
  let expireTimer = 0;

  function stop() {
    if (controller.signal.aborted) return;
    controller.abort();
    window.clearTimeout(expireTimer);
    unmark?.();
    document.removeEventListener("pointerdown", stop, true);
  }

  void waitForGuideElement(nodeId, GUIDE_CONFIG.findTimeoutMs, controller.signal).then((found) => {
    if (!found || controller.signal.aborted) return;
    scrollToGuideElement(found);
    unmark = markGuideElement(found);
    document.addEventListener("pointerdown", stop, true);
    expireTimer = window.setTimeout(stop, GUIDE_CONFIG.highlightMs);
  });

  return stop;
}

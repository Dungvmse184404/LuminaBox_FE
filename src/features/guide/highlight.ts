const FIND_TIMEOUT_MS = 4000;
const HIGHLIGHT_MS = 10000;
const SCROLL_DELAY_MS = 80;

export function highlightGuideTarget(nodeId: string): () => void {
  const selector = `[data-guide="${CSS.escape(nodeId)}"]`;
  let element: HTMLElement | null = null;
  let stopped = false;
  let expireTimer = 0;

  const observer = new MutationObserver(() => tryAttach());
  const giveUpTimer = window.setTimeout(stop, FIND_TIMEOUT_MS);

  function tryAttach() {
    if (stopped || element) return;
    const found = document.querySelector<HTMLElement>(selector);
    if (!found) return;

    element = found;
    observer.disconnect();
    window.clearTimeout(giveUpTimer);

    window.setTimeout(() => {
      if (stopped) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      found.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    }, SCROLL_DELAY_MS);

    found.setAttribute("data-guide-active", "");
    document.addEventListener("pointerdown", stop, true);
    expireTimer = window.setTimeout(stop, HIGHLIGHT_MS);
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    observer.disconnect();
    window.clearTimeout(giveUpTimer);
    window.clearTimeout(expireTimer);
    element?.removeAttribute("data-guide-active");
    document.removeEventListener("pointerdown", stop, true);
  }

  observer.observe(document.body, { childList: true, subtree: true });
  tryAttach();
  return stop;
}

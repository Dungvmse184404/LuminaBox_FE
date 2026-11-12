import { highlightGuideTarget, markGuideElement, prefersReducedMotion, scrollToGuideElement, waitForGuideElement } from "./highlight";
import { GUIDE_CONFIG } from "./guideConfig";
import { canAutoClick, type GuideNode } from "./navigationMap";

const PASS_THROUGH_KEYS = new Set(["Tab", "Shift"]);
const ACTIVATE_KEYS = new Set(["Enter", " "]);

type StepResult = "passed" | "cancelled" | "missing";

export function runGuideWalk(path: GuideNode[], countdownMs: number, onStepMissing: () => (() => void) | null): () => void {
  const controller = new AbortController();
  let stopTarget: (() => void) | null = null;

  void (async () => {
    for (const node of path.slice(0, -1)) {
      const result = await runStep(node, countdownMs, controller.signal);
      if (result === "passed") continue;
      controller.abort();
      if (result === "missing") stopTarget = onStepMissing();
      return;
    }
    if (!controller.signal.aborted) stopTarget = highlightGuideTarget(path[path.length - 1].id);
  })();

  return () => {
    controller.abort();
    stopTarget?.();
  };
}

async function runStep(node: GuideNode, countdownMs: number, signal: AbortSignal): Promise<StepResult> {
  const found = await waitForGuideElement(node.id, GUIDE_CONFIG.findTimeoutMs, signal);
  if (signal.aborted) return "cancelled";
  if (!found) return "missing";
  const element: HTMLElement = found;

  scrollToGuideElement(element);
  const unmark = markGuideElement(element);
  const autoClick = countdownMs > 0 && canAutoClick(node) && !prefersReducedMotion();
  const badge = autoClick ? showCountdown(element, countdownMs) : null;

  return new Promise<StepResult>((resolve) => {
    let settled = false;
    const autoTimer = autoClick ? window.setTimeout(() => element.click(), countdownMs) : 0;
    const idleTimer = window.setTimeout(() => finish("cancelled"), GUIDE_CONFIG.stepIdleTimeoutMs);

    const onClick = () => finish("passed");
    const onPointerDown = (event: PointerEvent) => {
      if (!element.contains(event.target as Node)) finish("cancelled");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (PASS_THROUGH_KEYS.has(event.key)) return;
      if (ACTIVATE_KEYS.has(event.key) && element.contains(event.target as Node)) return;
      finish("cancelled");
    };
    const onAbort = () => finish("cancelled");

    function finish(result: StepResult) {
      if (settled) return;
      settled = true;
      window.clearTimeout(autoTimer);
      window.clearTimeout(idleTimer);
      element.removeEventListener("click", onClick);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      signal.removeEventListener("abort", onAbort);
      unmark();
      badge?.remove();
      resolve(signal.aborted ? "cancelled" : result);
    }

    element.addEventListener("click", onClick);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    signal.addEventListener("abort", onAbort);
  });
}

function showCountdown(element: HTMLElement, countdownMs: number): HTMLElement {
  const badge = document.createElement("div");
  badge.className = "lb-guide-countdown";
  badge.setAttribute("aria-hidden", "true");
  badge.style.setProperty("--lb-guide-countdown-ms", `${countdownMs}ms`);
  document.body.appendChild(badge);

  const startedAt = performance.now();
  const follow = () => {
    if (!badge.isConnected) return;
    const rect = element.getBoundingClientRect();
    badge.style.left = `${Math.min(rect.right, window.innerWidth - GUIDE_CONFIG.badgeEdgePx)}px`;
    badge.style.top = `${Math.max(rect.top, GUIDE_CONFIG.badgeEdgePx)}px`;
    badge.textContent = String(Math.max(1, Math.ceil((countdownMs - (performance.now() - startedAt)) / 1000)));
    requestAnimationFrame(follow);
  };
  follow();
  return badge;
}

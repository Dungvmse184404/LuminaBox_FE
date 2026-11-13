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

export interface GuideMark {
  press: () => Promise<void>;
  release: () => void;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
}

type FocusPhase = "enter" | "idle" | "press" | "done";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
const easeIn = (t: number) => t * t * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function inflate(rect: DOMRect, radius: number, gap: number): Box {
  return { left: rect.left - gap, top: rect.top - gap, width: rect.width + gap * 2, height: rect.height + gap * 2, radius: radius + gap };
}

function centerDot(rect: DOMRect, size: number): Box {
  return { left: rect.left + rect.width / 2 - size / 2, top: rect.top + rect.height / 2 - size / 2, width: size, height: size, radius: size / 2 };
}

function mixBox(a: Box, b: Box, t: number): Box {
  return { left: mix(a.left, b.left, t), top: mix(a.top, b.top, t), width: mix(a.width, b.width, t), height: mix(a.height, b.height, t), radius: mix(a.radius, b.radius, t) };
}

function createLayer(className: string): HTMLDivElement {
  const layer = document.createElement("div");
  layer.className = className;
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);
  return layer;
}

function paint(layer: HTMLElement, box: Box, opacity: number) {
  layer.style.left = `${box.left}px`;
  layer.style.top = `${box.top}px`;
  layer.style.width = `${Math.max(0, box.width)}px`;
  layer.style.height = `${Math.max(0, box.height)}px`;
  layer.style.borderRadius = `${box.radius}px`;
  layer.style.opacity = String(clamp01(opacity));
}

export function markGuideElement(element: HTMLElement): GuideMark {
  element.setAttribute("data-guide-active", "");

  const config = GUIDE_CONFIG;
  const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
  const veil = createLayer("lb-guide-veil");
  const outer = createLayer("lb-guide-ring lb-guide-ring--outer");
  const inner = createLayer("lb-guide-ring");
  const layers = [veil, outer, inner];

  let phase: FocusPhase = prefersReducedMotion() ? "idle" : "enter";
  let phaseStart = performance.now();
  let frame = 0;
  let pressResolve: (() => void) | null = null;

  const render = (now: number) => {
    const rect = element.getBoundingClientRect();
    const visible = element.isConnected && rect.width > 0 && rect.height > 0;
    layers.forEach((layer) => (layer.style.display = visible && phase !== "done" ? "" : "none"));

    const elapsed = now - phaseStart;
    const innerBox = inflate(rect, radius, config.ringInnerGapPx);
    const outerBox = inflate(rect, radius, config.ringOuterGapPx);

    if (phase === "enter") {
      const veilSpread = Math.max(window.innerWidth, window.innerHeight);
      const t = easeOut(clamp01(elapsed / config.focusEnterMs));
      const tOuter = easeOut(clamp01((elapsed - config.focusOuterDelayMs) / config.focusEnterMs));
      paint(veil, inflate(rect, radius, config.ringInnerGapPx + veilSpread * (1 - t)), t);
      paint(inner, inflate(rect, radius, config.ringInnerGapPx + config.focusSpreadPx * (1 - t)), t);
      paint(outer, inflate(rect, radius, config.ringOuterGapPx + config.focusSpreadPx * (1 - tOuter)), config.ringOuterOpacity * tOuter);
      if (elapsed >= config.focusEnterMs + config.focusOuterDelayMs) {
        phase = "idle";
        phaseStart = now;
      }
    } else if (phase === "idle") {
      paint(veil, innerBox, 1);
      paint(inner, innerBox, 1);
      paint(outer, outerBox, config.ringOuterOpacity);
    } else if (phase === "press") {
      const p = clamp01(elapsed / config.pressMs);
      paint(inner, mixBox(innerBox, centerDot(rect, config.pressDotPx), easeIn(p)), 1 - easeIn(p));
      paint(outer, inflate(rect, radius, config.ringOuterGapPx + config.pressSpreadPx * easeOut(p)), config.ringOuterOpacity * (1 - p));
      paint(veil, inflate(rect, radius, config.ringInnerGapPx + config.pressSpreadPx * 4 * easeOut(p)), 1 - p);
      if (p >= 1) {
        phase = "done";
        pressResolve?.();
        pressResolve = null;
      }
    }

    if (phase !== "done") frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);

  const press = () =>
    new Promise<void>((resolve) => {
      if (phase === "done" || prefersReducedMotion()) return resolve();
      pressResolve = resolve;
      phase = "press";
      phaseStart = performance.now();
      element.animate([{ transform: "scale(1)" }, { transform: `scale(${config.pressScale})` }, { transform: "scale(1)" }], {
        duration: config.pressMs,
        easing: "ease-out",
        composite: "add",
      });
    });

  const release = () => {
    cancelAnimationFrame(frame);
    const fade = phase === "idle" && !prefersReducedMotion();
    phase = "done";
    pressResolve?.();
    pressResolve = null;
    element.removeAttribute("data-guide-active");
    layers.forEach((layer) => {
      if (!fade) return layer.remove();
      layer.animate([{ opacity: layer.style.opacity }, { opacity: 0 }], { duration: config.focusExitMs, easing: "ease-out" }).finished.then(
        () => layer.remove(),
        () => layer.remove(),
      );
    });
  };

  return { press, release };
}

export function highlightGuideTarget(nodeId: string): () => void {
  const controller = new AbortController();
  let mark: GuideMark | null = null;
  let expireTimer = 0;

  function stop() {
    if (controller.signal.aborted) return;
    controller.abort();
    window.clearTimeout(expireTimer);
    mark?.release();
    document.removeEventListener("pointerdown", stop, true);
  }

  void waitForGuideElement(nodeId, GUIDE_CONFIG.findTimeoutMs, controller.signal).then((found) => {
    if (!found || controller.signal.aborted) return;
    scrollToGuideElement(found);
    mark = markGuideElement(found);
    document.addEventListener("pointerdown", stop, true);
    expireTimer = window.setTimeout(stop, GUIDE_CONFIG.highlightMs);
  });

  return stop;
}

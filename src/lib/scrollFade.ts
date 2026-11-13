const IDLE_MS = 400;
const MIN_THUMB_PX = 28;
const EDGE_GAP = 2;
const THUMB_SIZE = 2;
const SCROLLERS = "[class*='overflow-y-auto'], [class*='overflow-x-auto'], [class*='overflow-auto'], .panel-scroll, .tl-rows";

const NATIVE_SCROLL = "[data-scroll-native]";

const supportsScrollEnd = "onscrollend" in window;

type Axis = "y" | "x";

interface ThumbState {
  el: HTMLDivElement;
  dragging: boolean;
}

const attached = new WeakMap<HTMLElement, () => void>();

function attach(el: HTMLElement) {
  if (attached.has(el) || el.closest(NATIVE_SCROLL)) return;

  const root = el === document.documentElement;
  const host = root ? document.body : el;
  const scrollSource: EventTarget = root ? document : el;
  const thumbs: Partial<Record<Axis, ThumbState>> = {};
  let hovering = false;
  let idleTimer = 0;
  let frame = 0;

  el.dataset.scrollFade = "on";

  const measure = (axis: Axis) => {
    const track = axis === "y" ? el.clientHeight : el.clientWidth;
    const content = axis === "y" ? el.scrollHeight : el.scrollWidth;
    const offset = axis === "y" ? el.scrollTop : el.scrollLeft;
    const maxScroll = content - track;
    const scrollable = maxScroll > 1;
    return {
      track,
      maxScroll,
      scrollable,
      length: scrollable ? Math.max(MIN_THUMB_PX, (track * track) / content) : 0,
      progress: scrollable ? offset / maxScroll : 0,
    };
  };

  const hide = () => {
    if (hovering || Object.values(thumbs).some((thumb) => thumb.dragging)) return;
    Object.values(thumbs).forEach((thumb) => (thumb.el.dataset.visible = "false"));
  };

  const armHide = (delay: number) => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(hide, delay);
  };

  const bindDrag = (axis: Axis, state: ThumbState) => {
    state.el.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const { track, length, maxScroll } = measure(axis);
      const startPointer = axis === "y" ? event.clientY : event.clientX;
      const startScroll = axis === "y" ? el.scrollTop : el.scrollLeft;
      const travel = track - length;
      state.dragging = true;
      state.el.dataset.dragging = "true";
      state.el.setPointerCapture(event.pointerId);

      const move = (next: PointerEvent) => {
        if (travel <= 0) return;
        const delta = (axis === "y" ? next.clientY : next.clientX) - startPointer;
        const position = startScroll + (delta / travel) * maxScroll;
        if (axis === "y") el.scrollTop = position;
        else el.scrollLeft = position;
      };
      const up = () => {
        state.dragging = false;
        delete state.el.dataset.dragging;
        state.el.removeEventListener("pointermove", move);
        state.el.removeEventListener("pointerup", up);
        state.el.removeEventListener("pointercancel", up);
        armHide(0);
      };
      state.el.addEventListener("pointermove", move);
      state.el.addEventListener("pointerup", up);
      state.el.addEventListener("pointercancel", up);
    });
  };

  const ensure = (axis: Axis) => {
    const existing = thumbs[axis];
    if (existing) return existing;

    const thumb = document.createElement("div");
    thumb.className = `lb-scroll-thumb lb-scroll-thumb--${axis}${root ? " lb-scroll-thumb--fixed" : ""}`;
    thumb.setAttribute("aria-hidden", "true");
    thumb.style.transition = "none";
    window.setTimeout(() => thumb.style.removeProperty("transition"), 0);
    thumb.addEventListener("pointerenter", () => {
      hovering = true;
    });
    thumb.addEventListener("pointerleave", () => {
      hovering = false;
      armHide(0);
    });

    const state: ThumbState = { el: thumb, dragging: false };
    thumbs[axis] = state;
    bindDrag(axis, state);
    return state;
  };

  const render = () => {
    frame = 0;
    if (!root) Object.values(thumbs).forEach((thumb) => thumb.el.style.setProperty("display", "none"));
    (["y", "x"] as const).forEach((axis) => {
      const { scrollable, track, length, progress } = measure(axis);
      if (!scrollable) {
        thumbs[axis]?.el.style.setProperty("display", "none");
        return;
      }

      const { el: thumb } = ensure(axis);
      if (thumb.parentNode !== host) host.appendChild(thumb);
      thumb.style.removeProperty("display");

      const along = progress * (track - length);
      const shiftY = root ? 0 : el.scrollTop;
      const shiftX = root ? 0 : el.scrollLeft;
      if (axis === "y") {
        const x = root ? 0 : shiftX + el.clientWidth - THUMB_SIZE - EDGE_GAP;
        thumb.style.height = `${length}px`;
        thumb.style.transform = `translate(${x}px, ${shiftY + along}px)`;
      } else {
        const y = root ? 0 : shiftY + el.clientHeight - THUMB_SIZE - EDGE_GAP;
        thumb.style.width = `${length}px`;
        thumb.style.transform = `translate(${shiftX + along}px, ${y}px)`;
      }
    });
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };

  const onScroll = () => {
    schedule();
    Object.values(thumbs).forEach((thumb) => (thumb.el.dataset.visible = "true"));
    window.clearTimeout(idleTimer);
    if (!supportsScrollEnd) armHide(IDLE_MS);
  };
  const onScrollEnd = () => armHide(IDLE_MS);

  scrollSource.addEventListener("scroll", onScroll, { passive: true });
  if (supportsScrollEnd) scrollSource.addEventListener("scrollend", onScrollEnd);

  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(el);
  const mutationObserver = new MutationObserver(schedule);
  mutationObserver.observe(el, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["open"] });

  render();

  attached.set(el, () => {
    window.clearTimeout(idleTimer);
    cancelAnimationFrame(frame);
    scrollSource.removeEventListener("scroll", onScroll);
    scrollSource.removeEventListener("scrollend", onScrollEnd);
    resizeObserver.disconnect();
    mutationObserver.disconnect();
    Object.values(thumbs).forEach((thumb) => thumb.el.remove());
    delete el.dataset.scrollFade;
    attached.delete(el);
  });
}

const scrollersIn = (node: HTMLElement) => [...(node.matches(SCROLLERS) ? [node] : []), ...node.querySelectorAll<HTMLElement>(SCROLLERS)];

export function initScrollFade() {
  attach(document.documentElement);
  scrollersIn(document.body).forEach(attach);

  new MutationObserver((records) => {
    for (const record of records) {
      record.removedNodes.forEach((node) => {
        if (node instanceof HTMLElement) scrollersIn(node).forEach((el) => attached.get(el)?.());
      });
      record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) scrollersIn(node).forEach(attach);
      });
      if (record.type === "attributes" && record.target instanceof HTMLElement && record.target.matches(SCROLLERS)) attach(record.target);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
}

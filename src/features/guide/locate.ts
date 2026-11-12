import { matchRoutes, type RouteObject } from "react-router-dom";
import type { UserRole } from "@/features/auth/types";
import { GUIDE_CONFIG } from "./guideConfig";
import type { NavKind } from "./navigationMap";

const DANGER_LOOKING_NAME = /^(xóa|xoá|hủy|huỷ|thanh toán|đăng xuất|delete|remove|logout)/i;
const CANDIDATE_SELECTOR = "a[href], button, [role=menuitem], [role=tab], [role=radio], input[placeholder], [data-guide]";

export interface GuideRouteHandle {
  roles?: UserRole[];
  guide?: false;
}

export interface GuideRoute {
  pattern: string;
  roles?: UserRole[];
  guide: boolean;
}

export interface GuideCandidate {
  element: HTMLElement;
  id: string;
  label: string;
  kind: NavKind;
  page: string | null;
  opens?: string;
  trigger: boolean;
  nameLooksDangerous: boolean;
  nameGuessed: boolean;
  nameHasNumber: boolean;
}

let registeredRoutes: RouteObject[] = [];

export function registerGuideRoutes(routes: RouteObject[]) {
  registeredRoutes = routes;
}

function joinPattern(paths: Array<string | undefined>): string {
  const parts = paths.flatMap((path) => (path ? path.split("/") : [])).filter(Boolean);
  return `/${parts.join("/")}`;
}

export function routePattern(pathname: string): string {
  const matches = matchRoutes(registeredRoutes, pathname);
  if (!matches || matches.length === 0) return pathname.replace(/\/+$/, "") || "/";
  return joinPattern(matches.map((match) => match.route.path));
}

export function routeInfo(pathname: string): GuideRoute {
  const matches = matchRoutes(registeredRoutes, pathname) ?? [];
  let roles: UserRole[] | undefined;
  let guide = true;
  for (const match of matches) {
    const handle = match.route.handle as GuideRouteHandle | undefined;
    if (handle?.roles) roles = handle.roles;
    if (handle?.guide === false) guide = false;
  }
  return { pattern: routePattern(pathname), roles, guide };
}

export function listGuideRoutes(): GuideRoute[] {
  const routes = new Map<string, GuideRoute>();
  const walk = (list: RouteObject[], base: string[], roles: UserRole[] | undefined, guide: boolean) => {
    for (const route of list) {
      const parts = route.path ? [...base, route.path] : base;
      const handle = route.handle as GuideRouteHandle | undefined;
      const nextRoles = handle?.roles ?? roles;
      const nextGuide = guide && handle?.guide !== false;
      if (route.children?.length) walk(route.children, parts, nextRoles, nextGuide);
      else if (route.index || route.path) {
        const pattern = joinPattern(parts);
        if (!routes.has(pattern)) routes.set(pattern, { pattern, roles: nextRoles, guide: nextGuide });
      }
    }
  };
  walk(registeredRoutes, [], undefined, true);
  return [...routes.values()];
}

export function guideSlug(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "x"
  );
}

function isVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const style = getComputedStyle(element);
  return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0.01;
}

function textOf(element: Element): string {
  return ((element as HTMLElement).innerText || element.textContent || "").replace(/\s+/g, " ").trim();
}

function isContainer(element: Element): boolean {
  return element.hasAttribute("data-guide") && !element.matches("a, button, input");
}

interface ElementName {
  name: string;
  guessed: boolean;
  declared?: boolean;
}

function nameOf(element: HTMLElement): ElementName {
  const declared = element.getAttribute("data-guide-label") || element.getAttribute("aria-label");
  if (declared) return { name: declared.trim(), guessed: false, declared: true };
  if (element instanceof HTMLInputElement) {
    const labelText = element.labels?.[0] ? textOf(element.labels[0]) : "";
    return { name: labelText || element.getAttribute("placeholder") || element.getAttribute("name") || "", guessed: false };
  }
  const heading = element.querySelector("h1, h2, h3, h4, strong");
  if (isContainer(element)) {
    if (heading) return { name: textOf(heading), guessed: false };
    return { name: element.querySelector("input")?.getAttribute("placeholder") || "", guessed: false };
  }
  const text = textOf(element);
  if (text.length > GUIDE_CONFIG.longNameChars) {
    if (heading) return { name: textOf(heading), guessed: true };
    const firstLine = (element.innerText || "").split("\n").map((line) => line.trim()).find(Boolean);
    if (firstLine) return { name: firstLine, guessed: true };
  }
  return { name: text || element.getAttribute("title") || "", guessed: false };
}

function pageOf(element: HTMLElement, pattern: string): string | null {
  const scope = element.closest("[data-guide-scope]")?.getAttribute("data-guide-scope");
  if (scope === "global") return null;
  return scope || pattern;
}

function roleOf(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();
  return element.getAttribute("role") || (tag === "a" ? "link" : tag === "button" ? "button" : tag === "input" ? "input" : "section");
}

function guessKind(element: HTMLElement, role: string, trigger: boolean): NavKind {
  const declared = element.getAttribute("data-guide-kind");
  if (declared) return declared as NavKind;
  if (role === "section") return element.querySelectorAll("input").length === 1 ? "input" : "section";
  if (role === "input" || role === "combobox" || role === "searchbox") return "input";
  if (element.tagName === "A") return "nav";
  if (trigger) return "nav";
  if ((element as HTMLButtonElement).type === "submit" || role === "radio") return "action";
  return "opener";
}

function sameOriginPath(element: HTMLElement): string | null | undefined {
  if (element.tagName !== "A") return undefined;
  try {
    const url = new URL(element.getAttribute("href") ?? "", location.href);
    return url.origin === location.origin ? url.pathname : null;
  } catch {
    return null;
  }
}

export function collectGuideCandidates(pattern = routePattern(location.pathname)): GuideCandidate[] {
  const candidates: GuideCandidate[] = [];

  for (const element of document.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR)) {
    if (element.closest("[data-guide-ignore]") || !isVisible(element)) continue;
    const wrapper = element.parentElement?.closest("[data-guide]");
    if (element instanceof HTMLInputElement && wrapper && isContainer(wrapper)) continue;

    const path = sameOriginPath(element);
    if (path === null) continue;

    const dataGuide = element.getAttribute("data-guide");
    const { name: fullName, guessed, declared } = nameOf(element);
    const name = fullName.slice(0, 80);
    if (!name && !dataGuide && element.tagName !== "A") continue;

    const role = roleOf(element);
    const trigger =
      (element.tagName === "BUTTON" && (element.hasAttribute("aria-haspopup") || element.hasAttribute("aria-expanded"))) || role === "tab";
    const page = pageOf(element, pattern);
    const opens = path ? routePattern(path) : undefined;
    const kind = guessKind(element, role, trigger);
    const scope = page ?? "global";
    const id = dataGuide ?? (opens?.includes(":") ? `${scope}#link:${opens}` : `${scope}#${role}:${guideSlug(name || "unnamed")}`);

    candidates.push({
      element,
      id,
      label: name || `→ ${opens}`,
      kind,
      page,
      opens,
      trigger: trigger && kind === "nav",
      nameLooksDangerous: kind !== "danger" && DANGER_LOOKING_NAME.test(name),
      nameGuessed: guessed && !dataGuide,
      nameHasNumber: !dataGuide && !declared && role !== "input" && /\d/.test(name),
    });
  }

  return candidates;
}

export function findGuideElement(nodeId: string): HTMLElement | null {
  if (!nodeId.includes("#")) return document.querySelector<HTMLElement>(`[data-guide="${CSS.escape(nodeId)}"]`);
  return collectGuideCandidates().find((candidate) => candidate.id === nodeId)?.element ?? null;
}

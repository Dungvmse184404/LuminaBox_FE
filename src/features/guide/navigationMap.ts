import type { UserRole } from "@/features/auth/types";
import overrides from "./guide-overrides.json";
import generated from "./navigationMap.generated.json";

export type NavKind = "nav" | "opener" | "action" | "danger" | "input" | "section";

export interface NavNode {
  id: string;
  label: string;
  kind: NavKind;
  page: string | null;
  opens?: string;
  next: string[];
  roles?: UserRole[];
}

export interface GuideNode extends NavNode {
  excluded: boolean;
}

interface GuideOverrides {
  exclude: string[];
  kinds: Record<string, string>;
}

interface GeneratedNode {
  id: string;
  label: string;
  kind: string;
  page: string | null;
  opens?: string;
  next: string[];
  roles?: string[];
}

const NAV_KINDS: readonly NavKind[] = ["nav", "opener", "action", "danger", "input", "section"];
const USER_ROLES: readonly UserRole[] = ["User", "Organization", "Manager"];

export const MANUAL_NODES: NavNode[] = [];

function isNavKind(value: string): value is NavKind {
  return (NAV_KINDS as readonly string[]).includes(value);
}

function toPattern(glob: string): RegExp {
  const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function pagePatternMatches(nodePage: string, pattern: string): boolean {
  if (nodePage === pattern) return true;
  if (!nodePage.endsWith("/*")) return false;
  const base = nodePage.slice(0, -2);
  return pattern === base || pattern.startsWith(`${base}/`);
}

function fromGenerated(node: GeneratedNode): NavNode {
  const roles = node.roles?.filter((role): role is UserRole => (USER_ROLES as readonly string[]).includes(role));
  return {
    id: node.id,
    label: node.label,
    kind: isNavKind(node.kind) ? node.kind : "opener",
    page: node.page,
    opens: node.opens,
    next: node.next,
    roles: roles && roles.length > 0 ? roles : undefined,
  };
}

export function mergeNodes(base: NavNode[], manual: NavNode[]): NavNode[] {
  const byId = new Map(base.map((node) => [node.id, { ...node, next: [...node.next] }]));
  for (const node of manual) {
    const existing = byId.get(node.id);
    byId.set(node.id, existing ? { ...existing, next: [...new Set([...existing.next, ...node.next])] } : { ...node, next: [...node.next] });
  }
  for (const node of manual) {
    if (!node.page) continue;
    for (const parent of byId.values()) {
      if (parent.opens && pagePatternMatches(node.page, parent.opens) && !parent.next.includes(node.id)) parent.next.push(node.id);
    }
  }
  return [...byId.values()];
}

export function applyOverrides(nodes: NavNode[], config: GuideOverrides): GuideNode[] {
  const excludePatterns = config.exclude.map(toPattern);
  return nodes.map((node) => {
    const kind = config.kinds[node.id];
    return {
      ...node,
      kind: kind && isNavKind(kind) ? kind : node.kind,
      excluded: excludePatterns.some((pattern) => pattern.test(node.id)),
    };
  });
}

const GENERATED_NODES = (generated as { nodes: GeneratedNode[] }).nodes.map(fromGenerated);

export const NAV_NODES: GuideNode[] = applyOverrides(mergeNodes(GENERATED_NODES, MANUAL_NODES), overrides);

const BY_ID = new Map(NAV_NODES.map((node) => [node.id, node]));

export function findNavNode(id: string): GuideNode | undefined {
  return BY_ID.get(id);
}

export function canAutoClick(node: GuideNode): boolean {
  return node.kind === "nav" && !node.excluded;
}

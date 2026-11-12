import type { UserRole } from "@/features/auth/types";
import overrides from "./guide-overrides.json";
import { findNavNode, type GuideNode } from "./navigationMap";

export type GuideParams = Record<string, string>;

interface GuideParamDefinition {
  urlKey: string;
  description: string;
}

interface GuideDefinition {
  target: string;
  label: string;
  description: string;
  params?: Record<string, GuideParamDefinition>;
}

export interface GuideOption {
  id: string;
  label: string;
  description: string;
  params: Array<{ name: string; description: string }>;
}

export const GUIDES: Record<string, GuideDefinition> = (overrides as { guides: Record<string, GuideDefinition> }).guides;

function definitionOf(id: string): GuideDefinition | undefined {
  return Object.prototype.hasOwnProperty.call(GUIDES, id) ? GUIDES[id] : undefined;
}

export function guideTarget(id: string): GuideNode | undefined {
  const definition = definitionOf(id);
  const node = definition && findNavNode(definition.target);
  return node && !node.excluded ? node : undefined;
}

export function guideSearch(id: string, params: GuideParams = {}): string | null {
  const definition = definitionOf(id);
  if (!definition?.params) return null;

  const search = new URLSearchParams();
  for (const [name, param] of Object.entries(definition.params)) {
    const value = params[name]?.trim();
    if (value) search.set(param.urlKey, value);
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export function availableGuides(hasRole: (...roles: UserRole[]) => boolean): GuideOption[] {
  return Object.entries(GUIDES).flatMap(([id, definition]) => {
    const node = guideTarget(id);
    if (!node || (node.roles && !hasRole(...node.roles))) return [];
    return [
      {
        id,
        label: definition.label,
        description: definition.description,
        params: Object.entries(definition.params ?? {}).map(([name, param]) => ({ name, description: param.description })),
      },
    ];
  });
}

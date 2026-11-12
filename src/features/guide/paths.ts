import { matchPath } from "react-router-dom";
import { collectGuideCandidates } from "./locate";
import { NAV_NODES, findNavNode, type GuideNode, type NavKind } from "./navigationMap";

const PASSABLE_KINDS: readonly NavKind[] = ["nav", "opener"];

export function isOnPage(page: string | null, pathname: string): boolean {
  return page === null || !!matchPath({ path: page, end: true }, pathname);
}

function revealedInPlace(node: GuideNode): boolean {
  return NAV_NODES.some((parent) => !parent.opens && parent.page === node.page && parent.next.includes(node.id));
}

export function findGuidePath(targetId: string, pathname: string, canUse: (node: GuideNode) => boolean): GuideNode[] | null {
  const candidates = NAV_NODES.filter((node) => canUse(node) && isOnPage(node.page, pathname) && !revealedInPlace(node));
  const renderedIds = new Set(collectGuideCandidates().map((candidate) => candidate.id));
  const rendered = candidates.filter((node) => renderedIds.has(node.id));
  const starts = rendered.length > 0 ? rendered : candidates;
  const queue: GuideNode[][] = starts.map((node) => [node]);
  const visited = new Set(starts.map((node) => node.id));

  while (queue.length > 0) {
    const path = queue.shift()!;
    const last = path[path.length - 1];
    if (last.id === targetId) return path;
    if (!PASSABLE_KINDS.includes(last.kind)) continue;

    for (const nextId of last.next) {
      const next = findNavNode(nextId);
      if (!next || visited.has(next.id) || !canUse(next)) continue;
      visited.add(next.id);
      queue.push([...path, next]);
    }
  }

  return null;
}

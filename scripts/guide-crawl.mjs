// Draws the on-screen guide map by walking the real UI (mock mode, one pass per role, plus mock data scenarios).
// Output: src/features/guide/navigationMap.generated.json. Run: pnpm guide:crawl [--check]
// Safety: only menu / dropdown / tab triggers are clicked; links are read from their href; nothing is submitted.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createLogger, createServer } from "vite";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, "src/features/guide/navigationMap.generated.json");
const LOCATE_MODULE = "/src/features/guide/locate.ts";
const MOCK_SERVER_MODULE = "/src/mocks/server.ts";
const MOCK_SCENARIO_MODULE = "/src/mocks/scenario.ts";
const PORT = 5181;
const ROLES = ["User", "Organization", "Manager"];
const READY_POLL_MS = 100;
const READY_CALM_POLLS = 2;
const READY_TIMEOUT_MS = 5000;
const MAX_PAGES_PER_ROLE = 80;
const EMPTY_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

const check = process.argv.includes("--check") || process.argv.includes("--compare");

function pageMatches(nodePage, pattern) {
  if (nodePage === pattern) return true;
  if (!nodePage.endsWith("/*")) return false;
  const base = nodePage.slice(0, -2);
  return pattern === base || pattern.startsWith(`${base}/`);
}

function routeOf(page, pathname) {
  return page.evaluate(async ([modulePath, value]) => (await import(modulePath)).routeInfo(value), [LOCATE_MODULE, pathname]);
}

async function patternOf(page, pathname) {
  return (await routeOf(page, pathname)).pattern;
}

function staticRoutes(page) {
  return page.evaluate(async (modulePath) => (await import(modulePath)).listGuideRoutes(), LOCATE_MODULE);
}

function canOpen(route, role) {
  return !route.roles || route.roles.length === 0 || route.roles.includes(role);
}

function globToRegExp(glob) {
  return new RegExp(`^${glob.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
}

async function waitForReady(page) {
  await page.waitForLoadState("domcontentloaded");
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let calm = 0;
  while (Date.now() < deadline) {
    await page.waitForTimeout(READY_POLL_MS);
    const busy = await page.evaluate(async (modulePath) => {
      const { pendingMockRequests } = await import(modulePath);
      return pendingMockRequests() > 0 || document.querySelector(".lb-skeleton, [aria-busy='true']") !== null;
    }, MOCK_SERVER_MODULE);
    calm = busy ? 0 : calm + 1;
    if (calm >= READY_CALM_POLLS) return;
  }
}

function collect(page, pattern) {
  return page.evaluate(
    async ([modulePath, value]) => {
      const { collectGuideCandidates } = await import(modulePath);
      document.querySelectorAll("[data-crawl-idx]").forEach((element) => element.removeAttribute("data-crawl-idx"));
      return collectGuideCandidates(value).map((candidate, index) => {
        candidate.element.setAttribute("data-crawl-idx", String(index));
        return {
          idx: String(index),
          id: candidate.id,
          label: candidate.label,
          kind: candidate.kind,
          page: candidate.page,
          opens: candidate.opens,
          clickable: candidate.trigger,
          dangerLooking: candidate.nameLooksDangerous,
          nameGuessed: candidate.nameGuessed,
          nameHasNumber: candidate.nameHasNumber,
        };
      });
    },
    [LOCATE_MODULE, pattern],
  );
}

class GuideGraph {
  nodes = new Map();
  dangerLooking = new Set();
  nameGuessed = new Set();
  nameHasNumber = new Set();
  routeWarnings = [];
  redirects = new Set();

  add(node, role) {
    if (node.dangerLooking) this.dangerLooking.add(node.id);
    if (node.nameGuessed) this.nameGuessed.add(`${node.id} ("${node.label}")`);
    if (node.nameHasNumber) this.nameHasNumber.add(`${node.id} ("${node.label}")`);
    const existing = this.nodes.get(node.id);
    if (existing) {
      existing.roles.add(role);
      return existing;
    }
    const { idx, clickable, dangerLooking, nameGuessed, nameHasNumber, ...fields } = node;
    const stored = { ...fields, next: new Set(), roles: new Set([role]), revealed: false };
    this.nodes.set(node.id, stored);
    return stored;
  }

  toJson() {
    for (const node of this.nodes.values()) {
      if (!node.opens) continue;
      for (const other of this.nodes.values()) {
        if (other.id !== node.id && !other.revealed && other.page !== null && pageMatches(other.page, node.opens)) node.next.add(other.id);
      }
    }
    return [...this.nodes.values()]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((node) => ({
        id: node.id,
        label: node.label,
        kind: node.kind,
        page: node.page,
        ...(node.opens ? { opens: node.opens } : {}),
        next: [...node.next].sort(),
        ...(node.roles.size === ROLES.length ? {} : { roles: [...node.roles].sort() }),
      }));
  }
}

async function crawlPage(page, pattern, role, graph, explored) {
  const before = await collect(page, pattern);
  const beforeIds = new Set(before.map((node) => node.id));
  const links = new Set();

  for (const node of before) {
    graph.add(node, role);
    if (node.opens) links.add(node.opens);
  }

  for (const trigger of before.filter((node) => node.clickable)) {
    if (explored.has(trigger.id)) continue;
    explored.add(trigger.id);
    const url = page.url();
    const fresh = (await collect(page, pattern)).find((node) => node.id === trigger.id);
    if (!fresh) continue;
    try {
      await page.locator(`[data-crawl-idx="${fresh.idx}"]`).first().click({ timeout: 2000 });
    } catch {
      continue;
    }
    await waitForReady(page);

    const parent = graph.nodes.get(trigger.id);
    if (page.url() !== url) {
      parent.opens ??= await patternOf(page, new URL(page.url()).pathname);
    } else {
      for (const node of (await collect(page, pattern)).filter((n) => !beforeIds.has(n.id))) {
        const child = graph.add(node, role);
        child.revealed = true;
        parent.next.add(child.id);
        if (child.opens) links.add(child.opens);
      }
    }

    await page.keyboard.press("Escape");
    if (page.url() !== url) {
      await page.goto(url);
      await waitForReady(page);
      continue;
    }
    await waitForReady(page);
    const restored = (await collect(page, pattern)).map((node) => node.id);
    if (restored.length !== beforeIds.size || restored.some((id) => !beforeIds.has(id))) {
      await page.reload();
      await waitForReady(page);
    }
  }

  return links;
}

async function openPage(context, baseUrl, role, scenario) {
  const page = await context.newPage();
  page.on("dialog", (dialog) => dialog.dismiss());
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === baseUrl) return route.continue();
    if (/\.(png|jpe?g|webp)$/i.test(url.pathname)) return route.fulfill({ contentType: "image/png", body: EMPTY_PNG });
    return route.abort();
  });

  await page.goto(`${baseUrl}/`);
  await page.evaluate(
    async ([modulePath, id]) => {
      const { MOCK_SCENARIO_KEY } = await import(modulePath);
      if (id) localStorage.setItem(MOCK_SCENARIO_KEY, id);
      else localStorage.removeItem(MOCK_SCENARIO_KEY);
    },
    [MOCK_SCENARIO_MODULE, scenario?.id ?? null],
  );
  await page.reload();
  await waitForReady(page);
  await page.locator(`[data-mock-role="${role}"]`).click();
  await waitForReady(page);
  return page;
}

async function crawlRole(context, baseUrl, role, graph, scenario) {
  const page = await openPage(context, baseUrl, role, scenario);
  const seeds = scenario
    ? scenario.routes
    : (await staticRoutes(page)).filter((route) => route.guide && !route.pattern.includes(":") && !route.pattern.includes("*")).map((route) => route.pattern);
  const queue = [...seeds];
  const visited = new Set();
  const explored = new Set();
  const queuedDynamic = new Set();
  const crawled = [];

  while (queue.length > 0 && crawled.length < MAX_PAGES_PER_ROLE) {
    const pathname = queue.shift();
    const route = await routeOf(page, pathname);
    if (visited.has(route.pattern) || !route.guide) continue;
    visited.add(route.pattern);

    await page.goto(`${baseUrl}${pathname}`);
    await waitForReady(page);
    const landed = await routeOf(page, new URL(page.url()).pathname);
    const errorCode = await page.evaluate(() => document.querySelector("[data-error-page]")?.getAttribute("data-error-page") ?? null);
    const opened = landed.pattern === route.pattern && !errorCode;
    const denied = errorCode === "401" || errorCode === "403";
    const declared = route.roles ? (route.roles.length ? route.roles.join(", ") : "signed-in") : "public";
    if ((opened || denied) && opened !== canOpen(route, role)) {
      graph.routeWarnings.push(`${route.pattern}: handle says ${declared}, but ${role} ${opened ? "can" : "cannot"} open it${errorCode ? ` (${errorCode})` : ""}`);
    }
    if (!opened && !denied) graph.redirects.add(`${route.pattern} → ${errorCode ? `error ${errorCode}` : landed.pattern} (needs earlier steps or data)`);
    if (!opened) continue;

    crawled.push(route.pattern);
    const links = await crawlPage(page, route.pattern, role, graph, explored);
    if (scenario) continue;

    for (const link of links) {
      if (!link.includes(":") && !visited.has(link)) queue.push(link);
    }
    const concrete = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")].map((a) => new URL(a.href)).filter((u) => u.origin === location.origin).map((u) => u.pathname),
    );
    for (const href of concrete) {
      const linkPattern = await patternOf(page, href);
      if (linkPattern.includes(":") && !visited.has(linkPattern) && !queuedDynamic.has(linkPattern)) {
        queuedDynamic.add(linkPattern);
        queue.push(href);
      }
    }
  }

  await page.close();
  return crawled;
}

function printWarnings(title, lines) {
  if (lines.length === 0) return;
  console.log(`\n${title}:`);
  for (const line of lines) console.log(`  WARN    ${line}`);
}

async function checkGuides(context, baseUrl, generated, graph) {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  const { guides, manual, overrides } = await page.evaluate(async () => ({
    guides: (await import("/src/features/guide/guides.ts")).GUIDES,
    manual: (await import("/src/features/guide/navigationMap.ts")).MANUAL_NODES.map((node) => node.id),
    overrides: (await import("/src/features/guide/guide-overrides.json")).default,
  }));
  await page.close();

  const byId = new Map(generated.map((node) => [node.id, node]));
  const allIds = [...byId.keys(), ...manual];
  let broken = 0;

  console.log("\nGuides:");
  for (const [id, guide] of Object.entries(guides)) {
    const node = byId.get(guide.target);
    if (node) console.log(`  OK      ${id} → ${guide.target} (${node.roles ? node.roles.join(", ") : "all roles"})`);
    else if (manual.includes(guide.target)) console.log(`  MANUAL  ${id} → ${guide.target} (not seen by the crawler, kept from MANUAL_NODES)`);
    else {
      broken++;
      console.log(`  BROKEN  ${id} → ${guide.target} (target not found)`);
    }
  }

  printWarnings(
    "Guide targets without data-guide (renaming the text breaks them)",
    Object.entries(guides).filter(([, guide]) => guide.target.includes("#")).map(([id, guide]) => `${id} → ${guide.target}`),
  );
  printWarnings(
    "Overrides that match no node",
    [
      ...overrides.exclude.filter((glob) => !allIds.some((nodeId) => globToRegExp(glob).test(nodeId))).map((glob) => `exclude "${glob}"`),
      ...Object.keys(overrides.kinds).filter((nodeId) => !allIds.includes(nodeId)).map((nodeId) => `kinds "${nodeId}"`),
    ],
  );
  printWarnings(
    "Names that look dangerous but the element is not declared danger (use a danger Button variant or data-guide-kind)",
    [...graph.dangerLooking].sort(),
  );
  printWarnings("Names guessed from long text (add data-guide-label or aria-label)", [...graph.nameGuessed].sort());
  printWarnings("Names containing numbers — a count in the name changes the id (add data-guide-label)", [...graph.nameHasNumber].sort());
  printWarnings("Route access differs from the route's handle.roles", graph.routeWarnings);
  if (graph.redirects.size) {
    console.log("\nRoutes that redirect when opened directly (not crawled):");
    for (const line of [...graph.redirects].sort()) console.log(`  INFO    ${line}`);
  }

  const removable = manual.filter((nodeId) => byId.has(nodeId));
  if (removable.length) console.log(`\nMANUAL_NODES now found by the crawler (can be removed): ${removable.join(", ")}`);
  return broken;
}

async function loadScenarios(browser, baseUrl) {
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/`);
  const scenarios = await page.evaluate(async (modulePath) => (await import(modulePath)).MOCK_SCENARIOS, MOCK_SCENARIO_MODULE);
  await page.close();
  return scenarios;
}

async function main() {
  process.env.VITE_USE_MOCK = "true";
  const logger = createLogger("warn");
  for (const level of ["warn", "error"]) {
    const write = logger[level];
    logger[level] = (message, options) => {
      if (options?.environment !== "client" && !String(message).includes("(client)")) write(message, options);
    };
  }
  const server = await createServer({ root: ROOT, customLogger: logger, server: { port: PORT, strictPort: true } });
  await server.listen();
  const baseUrl = `http://localhost:${PORT}`;
  const browser = await chromium.launch();

  try {
    const graph = new GuideGraph();
    const scenarios = await loadScenarios(browser, baseUrl);
    for (const scenario of [null, ...scenarios]) {
      for (const role of ROLES) {
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
        const pages = await crawlRole(context, baseUrl, role, graph, scenario);
        console.log(`${role}${scenario ? ` [${scenario.id}]` : ""}: ${pages.length} pages — ${pages.join(", ")}`);
        await context.close();
      }
    }

    const nodes = graph.toJson();
    await writeFile(OUTPUT, `${JSON.stringify({ roles: ROLES, nodes }, null, 2)}\n`);
    console.log(`\n${nodes.length} nodes → ${path.relative(ROOT, OUTPUT)}`);

    if (check) {
      const context = await browser.newContext();
      const broken = await checkGuides(context, baseUrl, nodes, graph);
      await context.close();
      if (broken > 0) process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

await main();

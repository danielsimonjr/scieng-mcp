import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  RenderError
} from "./chunk-JFFRTQ6A.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/browser/input.js
var DEFAULT_WIDTH = 800;
var DEFAULT_HEIGHT = 600;
var DEFAULT_SCALE = 1;
var MAX_SIDE = 16384;
var MAX_SCALE = 8;
var MAX_DEVICE_PIXELS = 64 * 1024 * 1024;
var MAX_BLOCKED_WARNINGS = 50;
var MAX_WARNING_URL_CHARS = 200;
function rejectUnknownKeys(options, allowed, pair) {
  for (const key of Object.keys(options)) {
    if (!allowed.includes(key)) {
      throw new RenderError("E_INPUT", `${pair} takes no option ${key}`);
    }
  }
}
function positiveInteger(options, key, fallback) {
  if (!(key in options))
    return fallback;
  const value = options[key];
  if (typeof value === "number" && Number.isInteger(value) && value > 0)
    return value;
  throw new RenderError("E_INPUT", `option ${key} must be a whole number greater than 0`);
}
function positiveNumber(options, key, fallback) {
  if (!(key in options))
    return fallback;
  const value = options[key];
  if (typeof value === "number" && Number.isFinite(value) && value > 0)
    return value;
  throw new RenderError("E_INPUT", `option ${key} must be a finite number greater than 0`);
}
function parsePngOptions(options) {
  rejectUnknownKeys(options, ["width", "height", "scale"], "html to png");
  const width = positiveInteger(options, "width", DEFAULT_WIDTH);
  const height = positiveInteger(options, "height", DEFAULT_HEIGHT);
  const scale = positiveNumber(options, "scale", DEFAULT_SCALE);
  if (width > MAX_SIDE || height > MAX_SIDE) {
    throw new RenderError("E_INPUT", `options width and height must not be more than ${MAX_SIDE}`);
  }
  if (scale > MAX_SCALE) {
    throw new RenderError("E_INPUT", `option scale must not be more than ${MAX_SCALE}`);
  }
  if (width * scale * (height * scale) > MAX_DEVICE_PIXELS) {
    throw new RenderError("E_INPUT", `the png must not have more than ${MAX_DEVICE_PIXELS} device pixels`);
  }
  return { width, height, scale };
}
function parsePdfOptions(options) {
  rejectUnknownKeys(options, [], "html to pdf");
}
function htmlSource(source) {
  if (typeof source !== "string") {
    throw new RenderError("E_INPUT", "html takes text, not bytes");
  }
  return source;
}
function browserPathOf(browser) {
  if (browser === void 0 || browser === "") {
    throw new RenderError("E_STAGE_MISSING", "the browser stage needs SCIENG_BROWSER or the browser configuration key");
  }
  return browser;
}
function escapeControls(text) {
  return text.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
}
function blockedWarnings(blocked) {
  const warnings = blocked.slice(0, MAX_BLOCKED_WARNINGS).map((url) => {
    const cut = url.length > MAX_WARNING_URL_CHARS ? `${url.slice(0, MAX_WARNING_URL_CHARS)}...` : url;
    return `the page requested ${escapeControls(cut)}; the browser stage refused the request`;
  });
  if (blocked.length > MAX_BLOCKED_WARNINGS) {
    warnings.push(`the browser stage refused ${blocked.length - MAX_BLOCKED_WARNINGS} more requests`);
  }
  return warnings;
}

// node_modules/@danielsimonjr/sciengjs/dist/browser/render.js
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join as join2 } from "node:path";

// node_modules/@danielsimonjr/sciengjs/dist/browser/cdp.js
var SOCKET_CLOSED_MESSAGE = "the DevTools socket closed";
function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return void 0;
  }
}
function errorText(error) {
  if (typeof error === "object" && error !== null) {
    const message = error.message;
    if (typeof message === "string") {
      return message;
    }
  }
  return JSON.stringify(error);
}
var CdpConnection = class {
  socket;
  closed = false;
  nextId = 1;
  pending = /* @__PURE__ */ new Map();
  eventHandlers = [];
  deadline;
  constructor(socket) {
    this.socket = socket;
    socket.addEventListener("message", (ev) => {
      this.handleMessageData(ev.data);
    });
    socket.addEventListener("close", () => {
      this.handleSocketClose();
    });
  }
  /** Sets the default deadline (a Date.now() time) of each later request that names no deadline of its own. */
  setDeadline(deadline) {
    this.deadline = deadline;
  }
  /** The count of requests that wait for a reply. */
  pendingCount() {
    return this.pending.size;
  }
  /**
   * Sends one request. A request with no reply before its deadline rejects with E_TIMEOUT, and its pending entry
   * is removed, so that a late reply is ignored.
   */
  send(method, params, sessionId, deadline = this.deadline) {
    if (this.closed) {
      return Promise.reject(new Error(SOCKET_CLOSED_MESSAGE));
    }
    const id = this.nextId++;
    const payload = {
      id,
      method,
      params: params ?? {}
    };
    if (sessionId !== void 0) {
      payload.sessionId = sessionId;
    }
    return new Promise((resolve, reject) => {
      const timer = deadline === void 0 ? void 0 : setTimeout(() => {
        this.pending.delete(id);
        reject(new RenderError("E_TIMEOUT", `the browser did not answer ${method} in time`));
      }, Math.max(0, deadline - Date.now()));
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify(payload));
    });
  }
  on(method, sessionId, handler) {
    this.eventHandlers.push({ method, sessionId, handler });
  }
  close() {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.rejectAllPending();
    this.socket.close();
  }
  handleMessageData(data) {
    if (typeof data !== "string") {
      return;
    }
    const parsed = safeJsonParse(data);
    if (parsed === null || typeof parsed !== "object") {
      return;
    }
    const message = parsed;
    if (typeof message.id === "number") {
      const pending = this.pending.get(message.id);
      if (pending === void 0) {
        return;
      }
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error !== void 0 && message.error !== null) {
        pending.reject(new Error(errorText(message.error)));
      } else {
        pending.resolve(message.result);
      }
      return;
    }
    if (typeof message.method !== "string") {
      return;
    }
    const eventSessionId = typeof message.sessionId === "string" ? message.sessionId : void 0;
    for (const entry of this.eventHandlers) {
      if (entry.method === message.method && entry.sessionId === eventSessionId) {
        entry.handler(message.params);
      }
    }
  }
  handleSocketClose() {
    this.closed = true;
    this.rejectAllPending();
  }
  rejectAllPending() {
    for (const pending of Array.from(this.pending.values())) {
      clearTimeout(pending.timer);
      pending.reject(new Error(SOCKET_CLOSED_MESSAGE));
    }
    this.pending.clear();
  }
};
function runtimeSocket(address) {
  return new WebSocket(address);
}
function connectCdp(address, deadline, makeSocket = runtimeSocket) {
  const socket = makeSocket(address);
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (fn) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      fn();
    };
    const timer = setTimeout(() => {
      settle(() => {
        socket.close();
        reject(new RenderError("E_TIMEOUT", `the DevTools socket ${address} did not open in time`));
      });
    }, Math.max(0, deadline - Date.now()));
    socket.addEventListener("open", () => settle(() => resolve(new CdpConnection(socket))));
    const fail = () => settle(() => reject(new RenderError("E_STAGE_MISSING", `cannot open the DevTools socket ${address}`)));
    socket.addEventListener("error", fail);
    socket.addEventListener("close", fail);
  });
}

// node_modules/@danielsimonjr/sciengjs/dist/browser/flags.js
function forcedBrowserFlags(input) {
  return [
    "--headless=new",
    // The DevTools port is an ephemeral loopback port. Another local process of the same user can reach it while the
    // render runs. A pipe (--remote-debugging-pipe) closes that route, but it needs extra file descriptors and
    // replaces the port file, so the client keeps the port. The port lives only for one render.
    "--remote-debugging-port=0",
    `--user-data-dir=${input.profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--do-not-de-elevate",
    "--disable-breakpad",
    "--disable-crash-reporter",
    `--proxy-server=http://127.0.0.1:${input.proxyPort}`,
    "--proxy-bypass-list=<-loopback>",
    "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1",
    "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
    // The browser makes no request of its own: no background service, no component update, no sync, no ping.
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--no-pings",
    "--disable-component-extensions-with-background-pages",
    // Linux containers often have a small /dev/shm. The browser then writes its shared memory to the temp folder.
    "--disable-dev-shm-usage"
  ];
}

// node_modules/@danielsimonjr/sciengjs/dist/browser/profile.js
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
var PROFILE_PREFIX = "sciengjs-browser-";
var HOLD_CODES = /* @__PURE__ */ new Set(["EBUSY", "EPERM", "ENOTEMPTY"]);
var RETRY_MS = 250;
function makeProfile() {
  return mkdtempSync(join(tmpdir(), PROFILE_PREFIX));
}
async function removeProfile(profile, deadline) {
  for (; ; ) {
    try {
      rmSync(profile, { recursive: true, force: true });
      return;
    } catch (err) {
      const code = err.code;
      if (code === void 0 || !HOLD_CODES.has(code) || Date.now() >= deadline) {
        throw new RenderError("E_INTERNAL", `cannot remove the browser profile ${profile}: ${err.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
  }
}

// node_modules/@danielsimonjr/sciengjs/dist/browser/proxy.js
import { once } from "node:events";
import { createServer as createHttpServer } from "node:http";
function hostOf(target) {
  if (/^https?:\/\//i.test(target)) {
    try {
      return new URL(target).hostname;
    } catch {
      return target;
    }
  }
  const colon = target.lastIndexOf(":");
  return colon > 0 ? target.slice(0, colon) : target;
}
var REFUSED = "HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n";
async function startRefusingProxy() {
  const log = [];
  const sockets = /* @__PURE__ */ new Set();
  const server = createHttpServer((req, res) => {
    log.push(hostOf(req.url ?? ""));
    res.writeHead(403, { Connection: "close", "Content-Length": "0" });
    res.end();
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("error", () => {
    });
    socket.on("close", () => sockets.delete(socket));
  });
  server.on("connect", (req, socket) => {
    log.push(hostOf(req.url ?? ""));
    socket.on("error", () => {
    });
    socket.end(REFUSED);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("the refusing proxy has no TCP address");
  }
  return {
    port: address.port,
    attempts: () => [...log],
    close: () => closeServer(server, sockets)
  };
}
function closeServer(server, sockets) {
  for (const socket of sockets)
    socket.destroy();
  return new Promise((resolve, reject) => {
    server.close((err) => err ? reject(err) : resolve());
  });
}

// node_modules/@danielsimonjr/sciengjs/dist/browser/render.js
var PAGE_URL = "http://sciengjs-page.invalid/";
var FAVICON_URL = "http://sciengjs-page.invalid/favicon.ico";
var PAGE_SHARE = 0.8;
var POLL_MS = 100;
var PORT_FILE = "DevToolsActivePort";
var HELD_READ_CODES = /* @__PURE__ */ new Set(["EBUSY", "EPERM", "ENOENT"]);
var IS_WINDOWS = process.platform === "win32";
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function watchChild(child, browser) {
  const state = { browser, exited: false, code: null, signal: null };
  child.once("error", (err) => {
    state.error = err;
  });
  child.once("exit", (code, signal) => {
    state.exited = true;
    state.code = code;
    state.signal = signal;
  });
  return state;
}
async function waitForBrowser(profile, state, deadline) {
  const file = join2(profile, PORT_FILE);
  for (; ; ) {
    if (state.error !== void 0) {
      throw new RenderError("E_STAGE_MISSING", `cannot start the browser at ${state.browser}: ${state.error.message}`);
    }
    if (state.exited) {
      throw new RenderError("E_STAGE_MISSING", `the browser exited with ${state.code ?? state.signal} before it published its DevTools port`);
    }
    if (existsSync(file)) {
      try {
        const lines = readFileSync(file, "utf8").split(/\r?\n/);
        const port = Number(lines[0]);
        if (Number.isInteger(port) && port > 0 && (lines[1] ?? "") !== "") {
          return `ws://127.0.0.1:${port}${lines[1]}`;
        }
      } catch (err) {
        if (!HELD_READ_CODES.has(err.code ?? ""))
          throw err;
      }
    }
    if (Date.now() >= deadline) {
      throw new RenderError("E_TIMEOUT", "the browser did not publish its DevTools port in time");
    }
    await sleep(POLL_MS);
  }
}
async function withDeadline(work, deadline, message) {
  let timer;
  const expired = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new RenderError("E_TIMEOUT", message)), Math.max(0, deadline - Date.now()));
  });
  try {
    return await Promise.race([work, expired]);
  } finally {
    clearTimeout(timer);
  }
}
var Interceptor = class {
  cdp;
  html;
  pinned;
  blocked = [];
  faults = [];
  guarded = /* @__PURE__ */ new Set();
  sessions = /* @__PURE__ */ new Map();
  sessionWaiters = /* @__PURE__ */ new Map();
  constructor(cdp, html, pinned) {
    this.cdp = cdp;
    this.html = html;
    this.pinned = pinned;
  }
  record = (err) => {
    this.faults.push(err instanceof Error ? err : new Error(String(err)));
  };
  /**
   * Intercepts every request of the session and auto-attaches its child targets (frames in another process,
   * workers, pop-ups) paused, so that each child is guarded the same way before it runs. A dedicated worker has no
   * Fetch domain: the session of its page intercepts its requests.
   */
  async guard(sessionId, type = "page") {
    if (this.guarded.has(sessionId))
      return;
    this.guarded.add(sessionId);
    const cdp = this.cdp;
    cdp.on("Fetch.requestPaused", sessionId, (params) => this.paused(sessionId, params));
    cdp.on("Target.attachedToTarget", sessionId, (params) => this.attached(params));
    if (type !== "worker")
      await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*" }] }, sessionId);
    await cdp.send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }, sessionId);
  }
  /** Guards a new child target, then lets it run. A child that cannot be guarded fails the render. */
  attached(params) {
    const { sessionId, targetInfo } = params;
    this.guard(sessionId, targetInfo.type).then(() => {
      this.sessions.set(targetInfo.targetId, sessionId);
      this.sessionWaiters.get(targetInfo.targetId)?.(sessionId);
      return this.cdp.send("Runtime.runIfWaitingForDebugger", {}, sessionId);
    }).catch(this.record);
  }
  /** The session of a target, once the target is attached and guarded. */
  sessionOf(targetId) {
    const known = this.sessions.get(targetId);
    if (known !== void 0)
      return Promise.resolve(known);
    return new Promise((resolve) => this.sessionWaiters.set(targetId, resolve));
  }
  paused(sessionId, params) {
    const cdp = this.cdp;
    const paused = params;
    if (paused.request.url === FAVICON_URL) {
      cdp.send("Fetch.fulfillRequest", { requestId: paused.requestId, responseCode: 204, responseHeaders: [], body: "" }, sessionId).catch(this.record);
      return;
    }
    if (paused.request.url === PAGE_URL) {
      cdp.send("Fetch.fulfillRequest", {
        requestId: paused.requestId,
        responseCode: 200,
        responseHeaders: [{ name: "Content-Type", value: "text/html; charset=utf-8" }],
        body: Buffer.from(this.html, "utf8").toString("base64")
      }, sessionId).catch(this.record);
      return;
    }
    const asset = this.pinned.get(paused.request.url);
    if (asset !== void 0) {
      cdp.send("Fetch.fulfillRequest", {
        requestId: paused.requestId,
        responseCode: 200,
        responseHeaders: [{ name: "Content-Type", value: asset.mime }],
        body: Buffer.from(asset.bytes).toString("base64")
      }, sessionId).catch(this.record);
      return;
    }
    this.blocked.push(paused.request.url);
    cdp.send("Fetch.failRequest", { requestId: paused.requestId, errorReason: "BlockedByClient" }, sessionId).catch(this.record);
  }
};
async function capturePage(cdp, req, deadline) {
  return withDeadline(capture(cdp, req), deadline, "the page did not load in time");
}
async function capture(cdp, req) {
  const guard = new Interceptor(cdp, req.html, req.pinned ?? /* @__PURE__ */ new Map());
  cdp.on("Target.attachedToTarget", void 0, (params) => {
    const { sessionId, targetInfo } = params;
    if (targetInfo.type === "page") {
      guard.attached(params);
    } else {
      cdp.send("Runtime.runIfWaitingForDebugger", {}, sessionId).catch(guard.record);
    }
  });
  await cdp.send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
  const target = await cdp.send("Target.createTarget", { url: "about:blank" });
  const s = await guard.sessionOf(target.targetId);
  const loads = /* @__PURE__ */ new Set();
  let onLoad;
  cdp.on("Page.lifecycleEvent", s, (params) => {
    const event = params;
    if (event.name === "load") {
      loads.add(event.loaderId);
      onLoad?.();
    }
  });
  await cdp.send("Page.enable", {}, s);
  await cdp.send("Page.setLifecycleEventsEnabled", { enabled: true }, s);
  if (req.format === "png" && req.awaitDone !== true) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: req.width, height: req.height, deviceScaleFactor: req.scale, mobile: false }, s);
  }
  const nav = await cdp.send("Page.navigate", { url: PAGE_URL }, s);
  if (nav.errorText !== void 0 && nav.errorText !== "") {
    throw new RenderError("E_INTERNAL", `the browser did not load the page: ${nav.errorText}`);
  }
  const loaderId = nav.loaderId ?? "";
  if (!loads.has(loaderId)) {
    await new Promise((resolve) => {
      onLoad = () => {
        if (loads.has(loaderId))
          resolve();
      };
    });
  }
  let bytes;
  if (req.awaitDone === true) {
    const done = await awaitDoneReport(cdp, s);
    if (!done.ok)
      throw new RenderError(done.internal === true ? "E_INTERNAL" : "E_INPUT", done.message);
    if (req.format === "svg") {
      bytes = new TextEncoder().encode(done.svg);
    } else {
      bytes = await drawDiagram(cdp, s, req);
    }
  } else if (req.format === "pdf") {
    await fitPageToDiagram(cdp, s);
    bytes = await printPdf(cdp, s);
  } else if (req.format === "png") {
    const data = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, s);
    bytes = Buffer.from(data.data, "base64");
  } else if (req.format === "dom") {
    const reply = await cdp.send("Runtime.evaluate", { expression: "document.documentElement.outerHTML", returnByValue: true }, s);
    bytes = new TextEncoder().encode(typeof reply.result?.value === "string" ? reply.result.value : "");
  } else {
    throw new RenderError("E_INTERNAL", "the page format is not drawn by this stage");
  }
  if (guard.faults.length > 0) {
    throw new RenderError("E_INTERNAL", `the browser rejected a page request: ${guard.faults[0]?.message ?? "unknown"}`);
  }
  return { bytes, blocked: guard.blocked };
}
async function awaitDoneReport(cdp, s) {
  const expression = "new Promise((resolve) => { const poll = () => (window.__sciengDone ? resolve(window.__sciengDone) : setTimeout(poll, 50)); poll(); })";
  const reply = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, s);
  const value = reply.result?.value;
  if (reply.exceptionDetails !== void 0 || value === void 0) {
    throw new RenderError("E_INTERNAL", "the page did not report a result");
  }
  return value;
}
async function diagramBox(cdp, s) {
  const expression = '(() => { const e = document.querySelector("#sciengjs-diagram svg"); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: Math.ceil(r.width), height: Math.ceil(r.height) }; })()';
  const reply = await cdp.send("Runtime.evaluate", { expression, returnByValue: true }, s);
  const box = reply.result?.value;
  return box === null || box === void 0 || box.width <= 0 || box.height <= 0 ? void 0 : box;
}
async function drawDiagram(cdp, s, req) {
  if (req.format === "svg" || req.format === "dom")
    throw new RenderError("E_INTERNAL", "an svg or dom is not drawn from a box");
  const box = await diagramBox(cdp, s);
  if (box === void 0)
    throw new RenderError("E_INPUT", "the diagram has no drawable size");
  if (req.format === "pdf") {
    await fitPageToDiagram(cdp, s);
    return printPdf(cdp, s);
  }
  if (box.width * req.scale * (box.height * req.scale) > MAX_DEVICE_PIXELS) {
    throw new RenderError("E_INPUT", `the png must not have more than ${MAX_DEVICE_PIXELS} device pixels`);
  }
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: Math.ceil(box.x + box.width), height: Math.ceil(box.y + box.height), deviceScaleFactor: req.scale, mobile: false }, s);
  const fitted = await diagramBox(cdp, s) ?? box;
  const data = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    clip: { x: fitted.x, y: fitted.y, width: fitted.width, height: fitted.height, scale: 1 }
  }, s);
  return Buffer.from(data.data, "base64");
}
async function fitPageToDiagram(cdp, s) {
  const box = await diagramBox(cdp, s);
  if (box === void 0)
    return;
  const css = `@page { size: ${box.width}px ${box.height}px; margin: 0 }`;
  await cdp.send("Runtime.evaluate", { expression: `(() => { const st = document.createElement("style"); st.textContent = ${JSON.stringify(css)}; document.head.appendChild(st); })()` }, s);
}
async function printPdf(cdp, s) {
  const data = await cdp.send("Page.printToPDF", { printBackground: true, preferCSSPageSize: true }, s);
  return Buffer.from(data.data, "base64");
}
function hasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}
async function waitForExit(child, deadline) {
  if (hasExited(child))
    return true;
  let timer;
  const exited = new Promise((resolve) => {
    child.once("exit", () => resolve(true));
    timer = setTimeout(() => resolve(hasExited(child)), Math.max(0, deadline - Date.now()));
  });
  const result = await exited;
  clearTimeout(timer);
  return result;
}
function killTree(child) {
  const pid = child.pid;
  if (pid === void 0)
    return;
  if (IS_WINDOWS) {
    if (hasExited(child))
      return;
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    return;
  }
  try {
    process.kill(-pid, "SIGKILL");
  } catch (err) {
    if (err.code !== "ESRCH")
      throw err;
  }
}
async function stopBrowser(cdp, child, deadline) {
  if (cdp !== void 0) {
    await cdp.send("Browser.close", {}, void 0, deadline).catch(() => void 0);
    cdp.close();
  }
  const closed = await waitForExit(child, deadline);
  killTree(child);
  if (closed)
    return;
  if (!await waitForExit(child, Math.max(deadline, Date.now() + 1e3))) {
    throw new RenderError("E_INTERNAL", "the browser did not stop after it was killed");
  }
}
async function renderHtmlPage(req) {
  const pageBudgetMs = Math.floor(req.timeoutMs * PAGE_SHARE);
  const cleanupBudgetMs = req.timeoutMs - pageBudgetMs;
  const deadline = Date.now() + pageBudgetMs;
  let proxy;
  let profile;
  let child;
  let state;
  let cdp;
  try {
    proxy = await startRefusingProxy();
    profile = makeProfile();
    req.onProfile?.(profile);
    try {
      child = spawn(req.browser, [...forcedBrowserFlags({ profileDir: profile, proxyPort: proxy.port }), "about:blank"], {
        stdio: "ignore",
        windowsHide: true,
        // On POSIX the browser leads a new process group, so that the cleanup can kill the whole tree.
        detached: !IS_WINDOWS
      });
    } catch (err) {
      throw new RenderError("E_STAGE_MISSING", `cannot start the browser at ${req.browser}: ${err.message}`);
    }
    state = watchChild(child, req.browser);
    const address = await waitForBrowser(profile, state, deadline);
    cdp = await connectCdp(address, deadline);
    cdp.setDeadline(deadline);
    return await capturePage(cdp, req, deadline);
  } finally {
    const cleanupDeadline = Date.now() + cleanupBudgetMs;
    try {
      if (child !== void 0 && state?.error === void 0)
        await stopBrowser(cdp, child, cleanupDeadline);
    } finally {
      try {
        await proxy?.close();
      } finally {
        if (profile !== void 0)
          await removeProfile(profile, cleanupDeadline);
      }
    }
  }
}

export {
  MAX_SCALE,
  parsePngOptions,
  parsePdfOptions,
  htmlSource,
  browserPathOf,
  blockedWarnings,
  renderHtmlPage
};

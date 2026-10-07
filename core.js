import Bridge from "@stremio/stremio-core-web/bridge";

let transport = null;
let worker = null;
let bridge = null;
let initialized = false;

const CINEMETA_URL = "https://v3-cinemeta.strem.io/manifest.json";

function ensureTransport() {
  if (transport) return transport;

  worker = new Worker(new URL("./core-worker.js", document.baseURI), { type: "classic" });
  bridge = new Bridge(window, worker);

  const stateListeners = new Set();
  const eventListeners = new Set();
  const errorListeners = new Set();

  window.onCoreEvent = ({ name, args } = {}) => {
    if (name === "NewState") {
      stateListeners.forEach((listener) => listener(args));
      return;
    }

    if (name === "CoreEvent") {
      if (args?.event === "Error") {
        errorListeners.forEach((listener) => listener(args.args));
      } else {
        eventListeners.forEach((listener) => listener(args));
      }
    }
  };

  transport = {
    init: (args) => bridge.call(["init"], [args]),
    getState: (model) => bridge.call(["getState"], [model]),
    dispatch: (action, model) => bridge.call(["dispatch"], [action, model, location.hash]),
    encodeStream: (stream) => bridge.call(["encodeStream"], [stream]),
    decodeStream: (stream) => bridge.call(["decodeStream"], [stream]),
    analytics: (event) => bridge.call(["analytics"], [event, location.hash]),
    on(name, listener) {
      if (name === "state") stateListeners.add(listener);
      if (name === "event") eventListeners.add(listener);
      if (name === "error") errorListeners.add(listener);
    },
    off(name, listener) {
      if (name === "state") stateListeners.delete(listener);
      if (name === "event") eventListeners.delete(listener);
      if (name === "error") errorListeners.delete(listener);
    }
  };

  return transport;
}

async function installDefaultCatalogAddon(core) {
  const response = await fetch(CINEMETA_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Cinemeta manifest HTTP ${response.status}`);
  const manifest = await response.json();

  await core.dispatch({
    action: "Ctx",
    args: {
      action: "InstallAddon",
      args: {
        manifest,
        transportUrl: CINEMETA_URL,
        flags: { official: true, protected: true }
      }
    }
  });
}

export async function initLunoCore() {
  if (initialized) return transport;

  const core = ensureTransport();

  core.on("error", (error) => console.error("LUNO Core error", error));
  core.on("event", (event) => console.debug("LUNO Core event", event));

  await core.init({
    appVersion: "0.3.0",
    shellVersion: null
  });

  initialized = true;
  window.__LUNO_CORE__ = core;
  window.dispatchEvent(new CustomEvent("luno-core-ready", { detail: { core } }));

  try {
    await installDefaultCatalogAddon(core);
  } catch (error) {
    console.warn("LUNO Cinemeta install warning", error);
  }

  // Give Core a moment to persist the addon before asking it to build the board.
  await new Promise((resolve) => setTimeout(resolve, 350));

  return core;
}

export function getLunoTransport() {
  return transport;
}

export async function loadLunoModel(model, modelName, extra = []) {
  const core = getLunoTransport();
  if (!core) throw new Error("LUNO Core is not initialized");

  await core.dispatch({
    action: "Load",
    args: {
      model,
      args: { extra }
    }
  }, modelName);

  return core.getState(modelName);
}

export async function loadBoard() {
  const state = await loadLunoModel("CatalogsWithExtra", "board", []);
  const rangeState = await loadBoardRange(0, 12);
  return rangeState || state;
}

export async function loadBoardRange(start, end) {
  const core = getLunoTransport();
  if (!core) throw new Error("LUNO Core is not initialized");

  const from = Math.max(0, Number(start) || 0);
  const to = Math.max(from + 1, Number(end) || from + 1);

  await core.dispatch({
    action: "CatalogsWithExtra",
    args: {
      action: "LoadRange",
      args: { start: from, end: to }
    }
  }, "board");

  return core.getState("board");
}

export async function searchLuno(query) {
  const value = String(query || "").trim();
  if (!value) return null;

  const state = await loadLunoModel("CatalogsWithExtra", "search", [["search", value]]);
  await loadBoardRange(0, 12);
  return state;
}

export async function getLunoModel(modelName) {
  const core = getLunoTransport();
  if (!core) return null;
  return core.getState(modelName);
}

export function onLunoState(listener) {
  const core = getLunoTransport();
  if (!core) return () => {};

  const handler = (models) => listener(models);
  core.on("state", handler);
  return () => core.off("state", handler);
}

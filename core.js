import Bridge from "@stremio/stremio-core-web/bridge";
let transport = null;
let worker = null;
let bridge = null;
let initialized = false;

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

export async function initLunoCore() {
  if (initialized) return transport;

  const core = ensureTransport();
  await core.init({
    appVersion: "0.3.0",
    shellVersion: null
  });

  initialized = true;
  window.__LUNO_CORE__ = core;
  window.dispatchEvent(new CustomEvent("luno-core-ready", { detail: { core } }));

  // Same addon synchronization entry point used by the official Stremio Web UI.
  await core.dispatch({
    action: "Ctx",
    args: { action: "PullAddonsFromAPI" }
  });

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
  return loadLunoModel("CatalogsWithExtra", "board", []);
}

export async function loadBoardRange(start, end) {
  const core = getLunoTransport();
  if (!core) throw new Error("LUNO Core is not initialized");

  const from = Math.max(0, Number(start) || 0);
  const to = Math.max(from, Number(end) || from);

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

  return loadLunoModel("CatalogsWithExtra", "search", [["search", value]]);
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

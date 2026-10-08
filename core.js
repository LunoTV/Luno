import Bridge from "@stremio/stremio-core-web/bridge";

let transport = null;
let worker = null;
let bridge = null;
let initialized = false;

const CINEMETA_URL = "https://v3-cinemeta.strem.io/manifest.json";
const DEMO_SOURCE_URL = new URL("./addons/luno-demo/manifest.json", document.baseURI).href;
const LUNO_ADDONS_KEY = "luno-addon-urls";

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

async function installAddonUrl(core, url, flags = {}) {
  const transportUrl = String(url || "").trim();
  if (!/^https:\/\/[^\s]+/i.test(transportUrl)) {
    throw new Error("Addon manifest must use HTTPS");
  }

  const response = await fetch(transportUrl, {
    cache: "no-store",
    headers: { accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Addon manifest HTTP ${response.status}`);

  const manifest = await response.json();
  if (!manifest?.id || !manifest?.name || !Array.isArray(manifest?.resources) || !Array.isArray(manifest?.types)) {
    throw new Error("Invalid addon manifest");
  }

  await core.dispatch({
    action: "Ctx",
    args: {
      action: "InstallAddon",
      args: {
        manifest,
        transportUrl,
        flags
      }
    }
  });

  return { manifest, transportUrl };
}

function readAddonUrls() {
  try {
    const value = JSON.parse(localStorage.getItem(LUNO_ADDONS_KEY) || "[]");
    return Array.isArray(value) ? value.filter((url) => typeof url === "string" && url) : [];
  } catch {
    return [];
  }
}

function writeAddonUrls(urls) {
  try {
    localStorage.setItem(LUNO_ADDONS_KEY, JSON.stringify([...new Set(urls)].slice(0, 20)));
  } catch {}
}

async function installDefaultCatalogAddon(core) {
  await installAddonUrl(core, CINEMETA_URL, { official: true, protected: true });
  await new Promise((resolve) => setTimeout(resolve, 350));
}

async function installConfiguredAddons(core) {
  const configured = [...new Set([DEMO_SOURCE_URL, ...readAddonUrls()])];
  const installed = [];
  for (const url of configured) {
    try {
      const result = await installAddonUrl(core, url);
      installed.push(result);
    } catch (error) {
      console.warn("LUNO addon install warning:", url, error);
    }
  }
  writeAddonUrls(configured);
  return installed;
}

export async function installLunoAddon(url) {
  const core = getLunoTransport();
  if (!core) throw new Error("LUNO Core is not initialized");
  const result = await installAddonUrl(core, url);
  writeAddonUrls([...readAddonUrls(), result.transportUrl]);
  await new Promise((resolve) => setTimeout(resolve, 350));
  return result.manifest;
}

export function getLunoAddonUrls() {
  return readAddonUrls();
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

  try {
    await installConfiguredAddons(core);
  } catch (error) {
    console.warn("LUNO addon bootstrap warning", error);
  }

  // Give Core a moment to persist the addons before asking it to build the board.
  await new Promise((resolve) => setTimeout(resolve, 1000));

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

export async function loadMetaDetails(item, videoId = "") {
  const core = getLunoTransport();
  if (!core) throw new Error("LUNO Core is not initialized");
  if (!item?.id) throw new Error("Missing media id");

  const type = item.type === "series" ? "series" : "movie";
  // Cinemeta/Stremio addons identify movies by IMDb ids (tt...). TMDB ids
  // are kept by LUNO for metadata, but must not be sent to addon resources.
  const id = type === "movie"
    ? String(item.imdbId || item.videoId || item.id || "")
    : String(item.id || "");
  const selected = {
    metaPath: {
      resource: "meta",
      type,
      id,
      extra: []
    },
    streamPath: videoId
      ? { resource: "stream", type, id: String(videoId), extra: [] }
      : null,
    guessStream: true
  };

  await core.dispatch({
    action: "Load",
    args: {
      model: "MetaDetails",
      args: selected
    }
  }, "meta_details");

  const started = Date.now();
  return waitForModel("meta_details", (state) => {
    const metaReady = state?.metaItem?.content?.type === "Ready";
    const resources = Array.isArray(state?.streams) && state.streams.length
      ? state.streams
      : (Array.isArray(state?.metaStreams) ? state.metaStreams : []);
    const settled = resources.length > 0 && resources.every(resource =>
      resource?.content?.type === "Ready" || resource?.content?.type === "Err"
    );
    if (metaReady && (settled || Date.now() - started > 1200)) return state;
    return null;
  }, 9000);
}

export async function loadLunoPlayer(stream, streamRequest, metaRequest = null, subtitlesPath = null) {
  const core = getLunoTransport();
  if (!core) throw new Error("LUNO Core is not initialized");
  if (!stream || !streamRequest) throw new Error("Missing stream");

  await core.dispatch({
    action: "Load",
    args: {
      model: "Player",
      args: {
        stream,
        streamRequest,
        metaRequest,
        subtitlesPath
      }
    }
  }, "player");

  return waitForModel("player", (state) => {
    const value = state?.stream;
    return value?.type === "Ready" ? state : null;
  }, 12000);
}

async function waitForModel(model, predicate, timeout = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const state = await getLunoModel(model);
    const result = predicate(state);
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return getLunoModel(model);
}

export async function unloadLunoPlayer() {
  const core = getLunoTransport();
  if (!core) return;
  await core.dispatch({ action: "Unload" }, "player");
}

export function dispatchLunoPlayerAction(action, args = {}) {
  const core = getLunoTransport();
  if (!core) return;
  return core.dispatch({
    action: "Player",
    args: { action, args }
  }, "player");
}

export function getReadyMetaStreams(state) {
  const resources = Array.isArray(state?.streams) && state.streams.length
    ? state.streams
    : (Array.isArray(state?.metaStreams) ? state.metaStreams : []);

  return resources.flatMap((resource) => {
    if (resource?.content?.type !== "Ready" || !Array.isArray(resource.content.content)) return [];
    return resource.content.content.map((stream) => ({
      stream,
      request: resource.request,
      addon: resource.addon || null
    }));
  });
}

export function getPlayerStreamUrl(state) {
  const value = state?.stream;
  if (value?.type !== "Ready") return "";
  const stream = value.content || {};
  return stream.url || stream.streamingUrl || stream.externalUrl || stream.webosUrl || "";
}

export function onLunoState(listener) {
  const core = getLunoTransport();
  if (!core) return () => {};

  const handler = (models) => listener(models);
  core.on("state", handler);
  return () => core.off("state", handler);
}

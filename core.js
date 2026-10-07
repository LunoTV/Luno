import Core from "@stremio/stremio-core-web";

let core = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitUntilReady(instance) {
  if (instance?.active === true) return;
  if (instance?.ready && typeof instance.ready.then === "function") {
    await instance.ready;
    return;
  }
  for (let i = 0; i < 120; i += 1) {
    if (instance?.active === true) return;
    await sleep(50);
  }
}

export async function initLunoCore() {
  if (core) return core;

  core = new Core({
    appVersion: "0.2.0",
    shellVersion: null
  });

  if (typeof core.start === "function") {
    const started = core.start();
    if (started?.then) await started;
  }

  await waitUntilReady(core);

  window.__LUNO_CORE__ = core;
  window.dispatchEvent(new CustomEvent("luno-core-ready", { detail: { core } }));

  return core;
}

export function getLunoTransport() {
  return core?.transport || core;
}

export async function loadLunoModel(model, modelName, extra = []) {
  const transport = getLunoTransport();
  if (!transport) throw new Error("LUNO Core is not initialized");

  await transport.dispatch({
    action: "Load",
    args: {
      model,
      args: { extra }
    }
  }, modelName);

  return transport.getState(modelName);
}

export async function loadBoard() {
  return loadLunoModel("CatalogsWithExtra", "board", []);
}

export async function searchLuno(query) {
  const value = String(query || "").trim();
  if (!value) return null;
  return loadLunoModel("CatalogsWithExtra", "search", [["search", value]]);
}

export async function getLunoModel(modelName) {
  const transport = getLunoTransport();
  if (!transport) return null;
  return transport.getState(modelName);
}

export function onLunoState(listener) {
  if (typeof core?.on !== "function") return () => {};
  const handler = (models) => listener(models);
  core.on("state", handler);
  return () => core.off("state", handler);
}

import Core from "@stremio/stremio-core-web";

let core = null;
let started = false;

export function initLunoCore() {
  if (core) return core;

  core = new Core({
    appVersion: "0.2.0",
    shellVersion: null
  });

  if (typeof core.start === "function") {
    core.start();
    started = true;
  }

  window.__LUNO_CORE__ = core;
  window.dispatchEvent(new CustomEvent("luno-core-ready", {
    detail: { core, started }
  }));

  return core;
}

export function getLunoCore() {
  return core;
}

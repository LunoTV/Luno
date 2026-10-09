const FOCUSABLE = [
  "button:not(:disabled)",
  "a[href]",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "[role=button]:not([aria-disabled=true])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

const LAYERS = [
  "#sourceSheet",
  "#subtitleSheet",
  "#qualitySheet",
  "#voiceSheet",
  "#episodeSheet",
  "#playerBrowseFilterMenu",
  "#addonManager",
  "#searchPanel",
  "#detail",
  "#libraryView",
  "#player"
];

const lastFocused = new Map();
let installed = false;

function visible(element) {
  if (!element || !element.isConnected || element.closest("[hidden],[inert],.hidden,[aria-hidden=true]")) return false;
  const style = getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getFocusable(root) {
  return [...root.querySelectorAll(FOCUSABLE)].filter((element) => {
    if (!visible(element) || element.tabIndex < 0) return false;
    if (element.matches("input[type=hidden]")) return false;
    return true;
  });
}

function activeLayer() {
  for (const selector of LAYERS) {
    const element = document.querySelector(selector);
    if (visible(element)) return element;
  }
  return document.querySelector("#app") || document.body;
}

function center(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function focusElement(element, root) {
  if (!element) return false;
  const previous = root.querySelector(".tv-remote-focus");
  if (previous && previous !== element) previous.classList.remove("tv-remote-focus");
  element.classList.add("tv-remote-focus");
  try { element.focus({ preventScroll: true }); } catch { element.focus(); }
  element.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
  lastFocused.set(root, element);
  return true;
}

function directionScore(from, to, direction) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const primary = direction === "left" ? -dx : direction === "right" ? dx : direction === "up" ? -dy : dy;
  if (primary <= 2) return Infinity;
  const secondary = direction === "left" || direction === "right" ? Math.abs(dy) : Math.abs(dx);
  const overlap = direction === "left" || direction === "right"
    ? Math.max(0, Math.min(from.bottom, to.bottom) - Math.max(from.top, to.top))
    : Math.max(0, Math.min(from.right, to.right) - Math.max(from.left, to.left));
  const alignmentBonus = overlap > 0 ? Math.min(secondary, 48) * 0.35 : 0;
  return primary + secondary * 2.1 - alignmentBonus;
}

function move(root, direction) {
  const all = getFocusable(root);
  if (!all.length) return false;

  const active = document.activeElement;
  if (!all.includes(active)) {
    const remembered = lastFocused.get(root);
    if (remembered && visible(remembered) && all.includes(remembered)) return focusElement(remembered, root);
    const preferred = all.find((element) => element.matches(".nav-item.active,.mobile-tab.active"))
      || all.find((element) => element.matches(".card"))
      || all[0];
    return focusElement(preferred, root);
  }

  const currentRect = active.getBoundingClientRect();
  const from = { ...currentRect, ...center(currentRect) };
  let best = null;
  let bestScore = Infinity;

  for (const candidate of all) {
    if (candidate === active) continue;
    const rect = candidate.getBoundingClientRect();
    const to = { ...rect, ...center(rect) };
    const score = directionScore(from, to, direction);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  if (best) return focusElement(best, root);

  if (direction === "left" || direction === "right") {
    let parent = active.parentElement;
    while (parent && parent !== root && parent !== document.body) {
      const style = getComputedStyle(parent);
      if (/(auto|scroll)/.test(style.overflowX) && parent.scrollWidth > parent.clientWidth + 4) {
        parent.scrollBy({ left: (direction === "left" ? -1 : 1) * Math.max(180, parent.clientWidth * 0.72), behavior: "auto" });
        return true;
      }
      parent = parent.parentElement;
    }
  } else if (root === document.body || root.id === "app") {
    window.scrollBy({ top: (direction === "up" ? -1 : 1) * Math.max(140, window.innerHeight * 0.55), behavior: "auto" });
    return true;
  }
  return false;
}

export function installRemoteNavigation() {
  if (installed) return;
  installed = true;

  document.addEventListener("keydown", (event) => {
    const direction = ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" })[event.key];
    if (!direction) return;

    const active = document.activeElement;
    const editing = active?.matches("input,textarea,[contenteditable=true]");
    if (editing && (direction === "left" || direction === "right")) return;
    if (active?.matches("video,audio")) return;

    const root = activeLayer();
    if (move(root, direction)) event.preventDefault();
  }, true);

  document.addEventListener("focusin", (event) => {
    const element = event.target;
    if (!element?.matches?.(FOCUSABLE)) return;
    const root = activeLayer();
    const previous = root.querySelector(".tv-remote-focus");
    if (previous && previous !== element) previous.classList.remove("tv-remote-focus");
    element.classList.add("tv-remote-focus");
    lastFocused.set(root, element);
  });

  document.addEventListener("focusout", (event) => {
    event.target?.classList?.remove("tv-remote-focus");
  });

  // Restore the last control in a layer when a sheet or screen is reopened.
  document.addEventListener("click", (event) => {
    const trigger = event.target?.closest?.("button,[role=button],a[href]");
    if (!trigger) return;
    const id = trigger.id;
    const mappings = {
      openAddonManager: "#addonManager",
      openAddonManagerTop: "#addonManager",
      openAddonManagerDetail: "#addonManager",
      openAddonManagerFromPlayer: "#addonManager"
    };
    const selector = mappings[id];
    if (!selector) return;
    const layer = document.querySelector(selector);
    if (!layer) return;
    requestAnimationFrame(() => {
      const candidates = getFocusable(layer);
      const target = lastFocused.get(layer);
      focusElement(target && candidates.includes(target) ? target : candidates[0], layer);
    });
  });
}

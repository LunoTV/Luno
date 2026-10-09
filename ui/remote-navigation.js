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
  "#confirmDialog",
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
let currentRoot = null;
let pendingFocus = null;

function elementRect(element) {
  const rect = element.getBoundingClientRect();
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
    width: rect.width, height: rect.height, x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2 };
}

function visible(element, rect = null, viewportOnly = false) {
  if (!element || !element.isConnected || element.closest("[hidden],[inert],.hidden,[aria-hidden=true]")) return false;
  const style = getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
  const box = rect || elementRect(element);
  if (box.width <= 0 || box.height <= 0) return false;
  // The home page can contain hundreds of cards. Only include elements near the
  // viewport in directional search; off-screen rows are reached by scrolling,
  // rather than measuring every card on every remote key press.
  if (viewportOnly && (box.right < -24 || box.left > window.innerWidth + 24 ||
      box.bottom < -24 || box.top > window.innerHeight + 24)) return false;
  return true;
}

function getFocusable(root, viewportOnly = false) {
  const elements = root.querySelectorAll(FOCUSABLE);
  const result = [];
  for (const element of elements) {
    if (element.tabIndex < 0 || element.matches("input[type=hidden]")) continue;
    const rect = elementRect(element);
    if (visible(element, rect, viewportOnly)) result.push({ element, rect });
  }
  return result;
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
  const active = document.activeElement;
  let entries;

  // Catalog rows contain many cards. Never measure the entire page for every
  // DPAD press: horizontal moves inspect one row; vertical moves inspect row
  // containers first and then measure only the cards in the nearest row.
  if (active?.matches?.(".card")) {
    const row = active.closest(".cards");
    if (row && (direction === "left" || direction === "right")) {
      // Include off-screen cards in this rail. Focus scrolls the next card into
      // view, so one DPAD press advances exactly one poster instead of jumping
      // an entire viewport and requiring a second press.
      entries = [...row.querySelectorAll(".card")].map((element) => ({ element, rect: elementRect(element) }))
        .filter((entry) => visible(entry.element, entry.rect, false));
    } else if (row && (direction === "up" || direction === "down")) {
      const fromRow = elementRect(row);
      const rows = [...root.querySelectorAll(".cards")].map((element) => ({ element, rect: elementRect(element) }))
        .filter((entry) => visible(entry.element, entry.rect, false) && entry.element !== row);
      const nextRows = rows.filter((entry) => direction === "up"
        ? entry.rect.bottom <= fromRow.top + 8
        : entry.rect.top >= fromRow.bottom - 8);
      nextRows.sort((a,b) => Math.abs((direction === "up" ? fromRow.top - a.rect.bottom : a.rect.top - fromRow.bottom))
        - Math.abs((direction === "up" ? fromRow.top - b.rect.bottom : b.rect.top - fromRow.bottom)));
      const targetRow = nextRows[0]?.element;
      entries = targetRow
        ? [...targetRow.querySelectorAll(".card")].map((element) => ({ element, rect: elementRect(element) }))
          .filter((entry) => visible(entry.element, entry.rect, false))
        : [];
      if (!entries.length) {
        window.scrollBy({ top: (direction === "up" ? -1 : 1) * Math.max(140, window.innerHeight * 0.48), behavior: "auto" });
        return true;
      }
    }
  }

  if (!entries) entries = getFocusable(root, true);
  if (!entries.length) return false;
  const all = entries.map((entry) => entry.element);
  const activeEntry = entries.find((entry) => entry.element === active);

  if (!activeEntry) {
    const remembered = lastFocused.get(root);
    if (remembered && visible(remembered, null, true) && all.includes(remembered)) return focusElement(remembered, root);
    const preferred = all.find((element) => element.matches(".nav-item.active,.mobile-tab.active"))
      || all.find((element) => element.matches(".card"))
      || all[0];
    return focusElement(preferred, root);
  }

  const from = activeEntry.rect;
  let best = null;
  let bestScore = Infinity;

  for (const entry of entries) {
    const candidate = entry.element;
    if (candidate === active) continue;
    const score = directionScore(from, entry.rect, direction);
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
    // Keep keyboard focus inside modal dialogs; background controls must not receive TV input.
    const root = activeLayer();
    if (event.key === "Tab" && root?.matches("#confirmDialog,[aria-modal=true]")) {
      const items = getFocusable(root).map((entry) => entry.element);
      if (!items.length) { event.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
        event.preventDefault(); focusElement(last, root);
      } else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) {
        event.preventDefault(); focusElement(first, root);
      }
      return;
    }

    const direction = ({
      ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
      Left: "left", Right: "right", Up: "up", Down: "down"
    })[event.key] || ({
      37: "left", 39: "right", 38: "up", 40: "down"
    })[event.keyCode];
    if (!direction) {
      // Older TV browsers sometimes report the remote's OK key only by keyCode.
      if ([13, 23].includes(event.keyCode) && !event.repeat) {
        const target = document.activeElement;
        if (target?.matches("button:not(:disabled),a[href],[role=button]:not([aria-disabled=true])")) {
          event.preventDefault();
          target.click();
        }
      }
      return;
    }

    const active = document.activeElement;
    const editing = active?.matches("input,textarea,[contenteditable=true]");
    if (editing && (direction === "left" || direction === "right")) return;
    if (active?.matches("video,audio")) return;

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

  currentRoot = activeLayer();

  // Remember the control that opened a new screen, then restore it on Back.
  document.addEventListener("click", (event) => {
    pendingFocus = { element: document.activeElement, root: activeLayer(), at: Date.now() };
  }, true);

  const layerObserver = new MutationObserver(() => {
    const nextRoot = activeLayer();
    if (nextRoot === currentRoot) return;

    if (currentRoot) {
      const active = document.activeElement;
      if (active && currentRoot.contains(active)) lastFocused.set(currentRoot, active);
      if (pendingFocus && pendingFocus.root === currentRoot && Date.now() - pendingFocus.at < 900) {
        lastFocused.set(currentRoot, pendingFocus.element);
      }
    }

    currentRoot = nextRoot;
    pendingFocus = null;
    requestAnimationFrame(() => {
      const candidates = getFocusable(nextRoot).map((entry) => entry.element);
      if (!candidates.length) return;
      const remembered = lastFocused.get(nextRoot);
      if (remembered && candidates.includes(remembered)) {
        focusElement(remembered, nextRoot);
      } else if (!nextRoot.contains(document.activeElement)) {
        const preferred = candidates.find((element) => element.matches(".nav-item.active,.mobile-tab.active"))
          || candidates.find((element) => element.matches(".card"))
          || candidates[0];
        focusElement(preferred, nextRoot);
      }
    });
  });

  layerObserver.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "hidden", "inert", "aria-hidden"] });

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
      const candidates = getFocusable(layer).map((entry) => entry.element);
      const target = lastFocused.get(layer);
      focusElement(target && candidates.includes(target) ? target : candidates[0], layer);
    });
  });
}

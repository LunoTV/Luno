import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("the shared LUNO design layer loads after legacy page styles", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const legacyStyles = html.search(/href="\.\/styles\.css\?v=\d+"/);
  const sharedStyles = html.search(/href="\.\/ui\/design-system\.css\?v=\d+"/);

  assert.notEqual(legacyStyles, -1, "versioned base stylesheet is linked");
  assert.notEqual(sharedStyles, -1, "shared design layer is linked");
  assert.ok(sharedStyles > legacyStyles, "shared layer follows the legacy stylesheet");
  assert.ok(!html.includes("source-manager.css"), "legacy source manager stylesheet is no longer referenced");
});

test("mobile settings sections open in a focused sheet with a return control", async () => {
  const css = await readFile(new URL("ui/design-system.css", root), "utf8");
  const app = await readFile(new URL("app.js", root), "utf8");
  assert.ok(css.includes(".settings-view.settings-section-open .settings-content"), "settings content has a focused mobile sheet");
  assert.ok(css.includes(".settings-view.settings-section-open .settings-menu"), "the menu is hidden while a section is open");
  assert.ok(app.includes('data-settings-sections-back'), "the section sheet has a return control");
  assert.ok(app.includes('openSettingsView(button.dataset.settingsSection,true)'), "selecting a section opens the focused view");
});

test("all core LUNO design tokens are defined in the shared layer", async () => {
  const css = await readFile(new URL("ui/design-system.css", root), "utf8");
  const tokens = {
    "--luno-bg": "#08090D",
    "--luno-surface": "#14151D",
    "--luno-surface-raised": "#242334",
    "--luno-violet": "#8581AD",
    "--luno-ice": "#8CB8CC",
    "--luno-text": "#E7E8EF",
    "--luno-text-muted": "#989BAA",
    "--luno-border": "#30313C",
    "--luno-border-strong": "#444452",
    "--luno-input": "#0B0C12",
  };

  for (const [name, value] of Object.entries(tokens)) {
    assert.ok(css.includes(`${name}: ${value}`), `missing approved token ${name}`);
  }
});

test("home, catalog, detail, settings, drawer and player share the design layer", async () => {
  const css = await readFile(new URL("ui/design-system.css", root), "utf8");
  for (const selector of [
    ".topbar", ".library-view", ".luno-detail", ".settings-view",
    ".luno-menu-drawer", ".mobile-tabbar", "#player .source-sheet",
  ]) {
    assert.ok(css.includes(selector), `missing shared style coverage for ${selector}`);
  }
});

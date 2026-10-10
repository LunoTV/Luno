import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("the shared LUNO design layer loads after legacy page styles", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const legacyStyles = html.search(/href="\.\/styles\.css\?v=\d+"/);
  const sharedStyles = html.search(/href="\.\/ui\/design-system\.css\?v=\d+"/);
  const settingsStyles = html.search(/href="\.\/ui\/settings\.css\?v=\d+"/);

  assert.notEqual(legacyStyles, -1, "versioned base stylesheet is linked");
  assert.notEqual(sharedStyles, -1, "shared design layer is linked");
  assert.notEqual(settingsStyles, -1, "isolated settings stylesheet is linked");
  assert.ok(sharedStyles > legacyStyles, "shared layer follows the legacy stylesheet");
  assert.ok(settingsStyles > sharedStyles, "isolated settings layer loads last");
  assert.ok(!html.includes("source-manager.css"), "legacy source manager stylesheet is no longer referenced");
});

test("mobile settings sections open in a focused sheet with a return control", async () => {
  const css = await readFile(new URL("ui/settings.css", root), "utf8");
  const app = await readFile(new URL("app.js", root), "utf8");
  assert.ok(css.includes(".settings-view.settings-section-open .settings-content"), "settings content has a focused mobile sheet");
  assert.ok(css.includes(".settings-view.settings-section-open .settings-menu"), "the menu is hidden while a section is open");
  assert.ok(css.includes(".settings-view .settings-content {\n    display: none !important;"), "mobile settings list is shown without a panel below it");
  assert.ok(app.includes('data-settings-sections-back'), "the section sheet has a return control");
  assert.ok(app.includes('openSettingsView(button.dataset.settingsSection,true)'), "selecting a section opens the focused view");
  assert.ok(app.includes('settingsView.querySelectorAll("[data-settings-panel]").forEach(panel=>panel.classList.add("hidden"))'), "returning to the menu clears every section panel");
});

test("mobile shutter exposes only contextual back and search controls", async () => {
  const css = await readFile(new URL("ui/design-system.css", root), "utf8");
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.ok(css.includes(".topbar.luno-nav-shutter .brand"), "brand is explicitly hidden in the mobile shutter");
  assert.ok(css.includes(".topbar.luno-nav-shutter .global-header-settings"), "settings button is explicitly hidden in the mobile shutter");
  assert.ok(css.includes("body.show-global-back .topbar.luno-nav-shutter .global-header-back"), "back is shown only on inner pages");
  assert.ok(css.includes(".topbar.luno-nav-shutter .global-header-search"), "search remains visible");
  assert.ok(css.includes(".topbar.luno-nav-shutter::after"), "legacy centered wordmark pseudo-element is explicitly removed");
  assert.ok(css.includes("html body.show-global-back .topbar.luno-nav-shutter > .brand"), "inner-page brand hiding outranks legacy high-specificity rules");
  const legacyCss = await readFile(new URL("styles.css", root), "utf8");
  assert.ok(legacyCss.includes("html body.show-global-back header.topbar.luno-nav-shutter > button.brand"), "final mobile header override is present after legacy stylesheet rules");
  assert.ok(html.includes("./ui/design-system.css?v=7"), "updated shutter styles use a fresh cache version");
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


test("movie detail uses the isolated card v2 instead of the legacy overlay", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const css = await readFile(new URL("ui/detail-page.css", root), "utf8");
  const app = await readFile(new URL("app.js", root), "utf8");
  assert.ok(html.includes('class="luno-card-page hidden"'), "new detail card root is present");
  assert.ok(!html.includes('class="detail-overlay hidden"'), "legacy detail overlay markup is removed");
  assert.ok(!html.includes('class="luno-detail"'), "legacy detail page markup is removed");
  assert.ok(html.includes("./ui/detail-page.css?v=8"), "isolated detail stylesheet is linked");
  for (const id of ["detailTitle","detailMeta","detailBadges","detailPlay","detailTrailer","detailFavorite","detailDescription","detailTags","detailCredits","detailSimilar","detailRecommendations","detailSeasonsSection","detailOpenEpisodes"]) {
    assert.ok(html.includes('id="' + id + '"'), "new card preserves integration point #" + id);
  }
  assert.ok(css.includes(".luno-card-page") && css.includes("@media(max-width:700px)"), "new page has isolated responsive styles");
  assert.ok(app.includes('document.querySelector(".luno-card-search")'), "new card search control is wired");
  assert.ok(app.includes('document.querySelectorAll(".luno-card-links [data-section]")'), "new card navigation is wired");
});


test("detail card hides the app shell header and mobile tab bar while open", async () => {
  const css = await readFile(new URL("ui/detail-page.css", root), "utf8");
  assert.ok(css.includes("body.detail-open #app > .topbar"), "app shutter is hidden while detail is open");
  assert.ok(css.includes("body.detail-open #app > .mobile-tabbar"), "mobile tab bar is hidden");
  assert.ok(css.includes("body.detail-open #detail.luno-card-page.hidden"), "hidden detail card stays hidden");
});


test("mobile detail hero uses the poster backdrop without a fixed 550px top gap", async () => {
  const css = await readFile(new URL("ui/detail-page.css", root), "utf8");
  assert.match(css, /\.luno-card-backdrop\{height:clamp\(430px,64svh,600px\)/);
  assert.match(css, /\.luno-card-hero\{min-height:clamp\(430px,64svh,600px\);padding:0 0 24px/);
  assert.ok(css.includes(".luno-card-backdrop-image{background-position:center 18%;opacity:.82"));
});


test("detail card isolates itself from Home and falls back to the poster backdrop", async () => {
  const css = await readFile(new URL("ui/detail-page.css", root), "utf8");
  const app = await readFile(new URL("app.js", root), "utf8");
  assert.ok(css.includes("body.detail-open #app > :not(#detail)"), "other app screens are hidden while detail is open");
  assert.ok(css.includes("body.detail-open #app > #detail.luno-card-page"), "detail is the active top-level screen");
  assert.ok(app.includes("const backdropImage=item?.background || item?.poster || item?.poster_path ||"), "poster is used when a backdrop is missing");
});


test("LUNO detail card is an isolated full-screen cinematic screen", async () => {
  const css = await readFile(new URL("ui/detail-page.css", root), "utf8");
  assert.ok(css.includes("body.detail-open #app > main"), "home main content is hidden while detail is open");
  assert.ok(css.includes("body.detail-open #app > #detail.luno-card-page"), "detail card owns the screen");
  assert.ok(css.includes("height: min(76svh, 720px) !important"), "cinematic backdrop fills the upper screen");
  assert.ok(css.includes("background-size: cover !important"), "poster art fills the backdrop");
  assert.ok(css.includes("background: linear-gradient(180deg,rgba(8,9,13,.12)"), "backdrop uses LUNO dark fade");
});


test("detail backdrop tries available TMDB image candidates until one loads", async () => {
  const app = await readFile(new URL("app.js", root), "utf8");
  assert.ok(app.includes("const backdropPath=String(item?.backdrop_path||item?.backdropPath||\"\").trim()"), "uses TMDB backdrop paths when present");
  assert.ok(app.includes("const candidates=[...new Set(["), "builds fallback image candidates");
  assert.ok(app.includes("image.onerror=()=>tryBackdrop(index+1)"), "tries the next image if a mirror fails");
  assert.ok(app.includes("image.onload=()=>{"), "only applies an image after it loads");
});

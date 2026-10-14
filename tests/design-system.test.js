import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("LUNO loads one clean UI stylesheet and a cache-versioned controller", async () => {
  const html = await read("index.html");
  assert.ok(html.includes('./ui/luno.css?v=1'), "the unified UI stylesheet is loaded");
  assert.ok(html.includes('./app.js?v=clean-shell-v1'), "the controller bypasses old browser cache");
  assert.equal((html.match(/rel="stylesheet"/g) || []).length, 1, "there is only one app stylesheet");
  for (const retired of ["styles.css?v=", "ui/design-system.css", "ui/detail-page.css", "ui/settings.css"]) {
    assert.ok(!html.includes(retired), retired + " is no longer loaded");
  }
});

test("new shell preserves navigation and the existing screen integration points", async () => {
  const html = await read("index.html");
  const app = await read("app.js");
  for (const id of ["app","homeHero","homeHeroDots","trendingCards","highRatedCards","topMoviesCards","topSeriesCards","libraryView","libraryContent","searchPanel","searchInput","searchResults","detail","detailBackdrop","detailPlay","detailFavorite","player","lunoVideo","playerEmpty","sourceSheet","sourceList","settingsView","settingsAuthForm"]) {
    assert.ok(html.includes('id="' + id + '"'), "required integration point #" + id + " exists");
  }
  for (const id of ["globalHeaderBack","globalHeaderSearch","topHeaderSettings","globalHeaderSettings"]) {
    assert.ok(html.includes('id="' + id + '"'), "navigation control #" + id + " exists");
  }
  assert.ok(app.includes('document.querySelector("#globalHeaderBack")'), "contextual back remains wired");
  assert.ok(app.includes('document.querySelector("#globalHeaderSearch")'), "global search remains wired");
  assert.ok(app.includes('document.querySelectorAll("#globalHeaderSettings,#topHeaderSettings")'), "settings controls remain wired");
  assert.ok(html.includes('data-section="catalog"') && html.includes('data-section="search"') && html.includes('data-section="library"'), "primary navigation retains its destinations");
});

test("the rebuilt responsive system covers home, detail, catalog, search, settings and player", async () => {
  const css = await read("ui/luno.css");
  for (const selector of [".home-hero",".cards",".luno-card-page",".luno-card-backdrop-image",".luno-catalog-results.is-grid",".luno-catalog-results.is-list",".search-box",".settings-view",".player-shell",".source-sheet",".mobile-tabbar"]) {
    assert.ok(css.includes(selector), "unified stylesheet covers " + selector);
  }
  assert.ok(css.includes("@media(max-width:700px)"), "phone layout is explicit");
  assert.ok(css.includes("@media(min-width:1000px) and (hover:none)"), "remote-controlled TV layout is explicit");
  assert.ok(css.includes("prefers-reduced-motion"), "reduced-motion preferences are respected");
  assert.ok(css.includes("env(safe-area-inset-bottom,0px)"), "bottom navigation respects device safe areas");
});

test("detail page keeps image, title, playback and favorite hooks together", async () => {
  const html = await read("index.html");
  const app = await read("app.js");
  const css = await read("ui/luno.css");
  assert.ok(html.includes('class="luno-card-page hidden"'), "the detail view has a dedicated root");
  assert.ok(html.includes('<img id="detailBackdrop" class="luno-card-backdrop-image"'), "the artwork uses a real image element");
  assert.ok(html.includes('id="detailTitle"') && html.includes('id="detailPlay"') && html.includes('id="detailFavorite"'), "title and primary actions exist");
  assert.ok(app.includes('detailPlay?.addEventListener("click"'), "play still enters the existing playback flow");
  assert.ok(app.includes('detailFavorite?.addEventListener("click"'), "favorites still use the existing state");
  assert.ok(css.includes("body.detail-open #app > :not(#detail)"), "the detail screen isolates itself from the shell");
  assert.ok(css.includes(".luno-card-backdrop-image.is-loaded"), "loaded artwork has a visible state");
});

test("player and source management remain backed by existing runtime modules", async () => {
  const html = await read("index.html");
  const app = await read("app.js");
  const engine = await read("source-engine.js");
  const sourceRuntime = await read("runtime/lampa-source-headless-entry.js");
  const coreRuntime = await read("runtime/lampa-headless-entry.js");
  for (const id of ["lunoVideo","playerQualityButton","playerEpisodeButton","playerVoiceButton","playerSubtitleButton","playerSourceButton","qualitySheet","episodeSheet","voiceSheet","subtitleSheet","sourceSheet","addonManager"]) {
    assert.ok(html.includes('id="' + id + '"'), "player/source hook #" + id + " remains");
  }
  assert.ok(app.includes("loadLunoPlayer") && app.includes("setLunoStream"), "the current playback controller remains connected");
  assert.ok(engine.includes("createSourceRegistry") && engine.includes("loadSourceDefinitions"), "the existing source engine remains the provider of streams");
  assert.ok(sourceRuntime.includes("videocdn") && sourceRuntime.includes("rezka") && sourceRuntime.includes("kinobase") && sourceRuntime.includes("cdnmovies"), "the headless Lampa source adapters remain included");
  assert.ok(coreRuntime.includes("Lampa TMDB source is unavailable") && coreRuntime.includes("version:"), "the pinned headless metadata runtime remains included");
  assert.ok(html.includes("./js/luno-lampa-runtime.js") && html.includes("./js/luno-lampa-source-runtime.js"), "built runtimes are still loaded");
});

test("catalog data pipeline and API deployment remain intact", async () => {
  const pkg = JSON.parse(await read("package.json"));
  const html = await read("index.html");
  const workflow = await read(".github/workflows/pages.yml");
  const apiWorkflow = await read(".github/workflows/luno-api.yml");
  assert.ok(pkg.scripts.build.includes("build-tmdb-catalog.mjs"), "build regenerates TMDB catalog data");
  assert.ok((await read("scripts/build-tmdb-catalog.mjs")).includes("TMDB_API_TOKEN"), "catalog data is generated from TMDB");
  assert.ok((await read("app.js")).includes('import bundledTmdbCatalog from "./tmdb-catalog.generated.js"'), "the app retains its generated catalog import");
  assert.ok(workflow.includes("Verify TMDB catalog is included in Pages artifact"), "deployment verifies catalog data");
  assert.ok(apiWorkflow.includes("npx wrangler deploy"), "the existing API Worker deployment remains intact");
  assert.ok(html.includes("tmdb-attribution"), "TMDB attribution remains in the interface");
});

test("source normalization and player libraries remain in the dependency graph", async () => {
  const pkg = JSON.parse(await read("package.json"));
  const engineTests = await read("tests/source-engine.test.js");
  assert.equal(pkg.dependencies["hls.js"], "1.7.2");
  assert.equal(pkg.dependencies.dashjs, "5.2.1");
  for (const phrase of ["4K URL","subtitles","registry","unsafe schemes"]) {
    assert.ok(engineTests.toLowerCase().includes(phrase.toLowerCase()), "source regression coverage includes " + phrase);
  }
});

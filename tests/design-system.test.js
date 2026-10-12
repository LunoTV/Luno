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
  assert.ok(legacyCss.includes("body.show-global-back .topbar.luno-nav-shutter .brand"), "the wordmark is hidden only on inner screens");
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
  const searchCss = await readFile(new URL("styles.css", root), "utf8");
  const app = await readFile(new URL("app.js", root), "utf8");
  assert.ok(html.includes('class="luno-card-page hidden"'), "new detail card root is present");
  assert.ok(!html.includes('class="detail-overlay hidden"'), "legacy detail overlay markup is removed");
  assert.ok(!html.includes('class="luno-detail"'), "legacy detail page markup is removed");
  assert.ok(html.includes("./ui/detail-page.css?v=9"), "isolated detail stylesheet is linked");
  for (const id of ["detailTitle","detailMeta","detailBadges","detailPlay","detailTrailer","detailFavorite","detailDescription","detailTags","detailCredits","detailSimilar","detailRecommendations","detailSeasonsSection","detailOpenEpisodes"]) {
    assert.ok(html.includes('id="' + id + '"'), "new card preserves integration point #" + id);
  }
  assert.ok(css.includes(".luno-card-page") && css.includes("@media(max-width:700px)"), "new page has isolated responsive styles");
  assert.ok(app.includes('document.querySelector(".luno-card-search")'), "new card search control is wired");
  assert.ok(html.includes("search-discovery-block") && html.includes("data-search-genre") && html.includes("search-mic"), "search uses the new genre discovery interface");
  assert.ok(app.includes("searchMediaCategory") && app.includes('document.querySelectorAll("[data-search-genre]")'), "genre cards and media category tabs are interactive");
  assert.ok(searchCss.includes(".search-genre-card") && searchCss.includes("body.search-open .luno-search-screen.luno-search-discovery"), "old search screen is replaced by the mobile discovery layout");
  assert.ok(app.includes('document.querySelectorAll(".luno-card-links [data-section]")'), "new card navigation is wired");
});


test("LUNO detail card supports TMDB title logos with text fallback", async () => {
  const app = await readFile(new URL("app.js", root), "utf8");
  const css = await readFile(new URL("ui/detail-page.css", root), "utf8");
  assert.ok(app.includes("async function loadDetailLogo(value,title)"), "loads the title logo from TMDB images");
  assert.ok(app.includes('"/images?"+params'), "uses the TMDB image endpoint directly");
  assert.ok(app.includes('detailTitle.classList.add("has-tmdb-logo")'), "marks the title only after the logo loads");
  assert.ok(app.includes('detailTitle.textContent=title'), "retains readable title text as fallback");
  assert.ok(css.includes(".luno-card-title-logo"), "styles the title logo within LUNO's detail card");
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
  assert.ok(app.includes("const backdropPath=String(item?.backdrop_path||item?.backdropPath||\"\").trim()"), "TMDB backdrop and poster candidates are resolved");
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


test("mobile navigation uses a floating glass bar with five SVG icon tabs", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const app = await readFile(new URL("app.js", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.ok(html.includes('class="mobile-tabbar luno-reference-tabbar"'), "uses the reference-style mobile navigation");
  for (const section of ["home","catalog","search","library","profile"]) {
    assert.ok(html.includes('data-section="'+section+'"'), "includes "+section+" navigation");
  }
  assert.ok((html.match(/<svg viewBox="0 0 24 24"/g)||[]).length>=5, "all five navigation items use clean SVG icons");
  assert.ok(app.includes('if(section==="library"){openLibrary("history");return;}'), "library opens saved favorites");
  assert.ok(app.includes('if(section==="profile" || section==="settings"){openSettingsView("profile");return;}'), "profile opens the existing profile/settings view");
  assert.ok(css.includes("bottom:calc(8px + env(safe-area-inset-bottom,0px))"), "navigation floats above the bottom safe area");
  assert.ok(css.includes("rgba(22,23,29,.70)"), "navigation uses a translucent glass background");
  assert.ok(css.includes("#8581AD"), "active navigation item uses LUNO violet");
  assert.ok(css.includes("rgba(140,184,204"), "navigation preserves the LUNO ice-blue accent");
});


test("home screen uses poster-led featured carousel and mobile category navigation", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const app = await readFile(new URL("app.js", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.ok(!html.includes('class="home-category-tabs"'), "duplicate category strip is removed from Home");
  assert.ok(html.includes('id="homeHeroDots"'), "featured carousel has slide indicators");
  assert.ok(html.includes('data-hero-action="favorite"'), "featured item has a favorite action");
  assert.ok(app.includes("const heroPool=catalogItems.slice()"), "featured items are curated from the catalog");
  assert.ok(app.includes('if(button.dataset.heroAction==="favorite")'), "featured favorite button is wired");
  assert.ok(app.includes('data-hero-slide'), "carousel indicators are wired");
  assert.ok(css.includes(".home-hero-backdrop{"), "featured artwork fills the hero");
  assert.ok(css.includes(".home-hero-dot[aria-current=\"true\"]"), "active slide indicator is styled");
  assert.ok(css.includes("grid-template-columns:repeat(5,minmax(0,1fr))")===false || css.includes(".mobile-tabbar.luno-reference-tabbar"), "existing navigation remains independent from home content");
});


test("legacy tall-hero and four-column home navigation overrides are removed", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.ok(!css.includes("body.home-mode .home-hero{margin-top:-60px!important"), "old hero bleed patch is removed");
  assert.ok(!css.includes("#homeHero{\n    min-height:500px!important"), "old fixed tall hero patch is removed");
  assert.ok(!css.includes("grid-template-columns:repeat(4,minmax(0,1fr))!important"), "old four-column nav override is removed");
  assert.ok(css.includes(".mobile-tabbar.luno-reference-tabbar") && css.includes("grid-template-columns: repeat(5,minmax(0,1fr)) !important"), "single five-column mobile nav rule remains");
  assert.ok(css.includes("body.show-global-back .topbar.luno-nav-shutter .brand"), "wordmark is hidden only on inner screens");
});


test("featured home screen has no unused legacy poster element or old hero sizing rules", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.ok(!html.includes("home-hero-poster-wrap"), "unused side-poster markup is removed");
  assert.ok(!css.includes(".home-hero-poster-wrap"), "unused side-poster CSS is removed");
  assert.ok(!css.includes("#homeHero{\n    min-height:500px!important"), "old fixed-height hero is removed");
  assert.ok(css.includes("home-hero-dots"), "active carousel indicators remain");
});


test("category tabs replace sibling history entries and restore a real home state", async () => {
  const app = await readFile(new URL("app.js", root), "utf8");
  assert.ok(app.includes('if(current===view || (isLunoLibraryRoute(current)&&isLunoLibraryRoute(view))) history.replaceState(next,"",url);'), "switching between categories does not stack extra Back entries");
  assert.ok(app.includes('function isLunoLibraryRoute(view){'), "category history views are classified centrally");
  const syncStart = app.indexOf("function syncLunoActiveNavigation()");
  const syncEnd = app.indexOf("window.addEventListener(\"pageshow\",syncLunoActiveNavigation)",syncStart);
  const sync = app.slice(syncStart,syncEnd);
  assert.ok(sync.includes('const isHomeView=!detailOpen&&!libraryOpen&&!searchOpen&&!settingsOpen&&!playerOpen;'), "home mode depends on visible views, not the active home tab");
  assert.ok(sync.includes('document.body.classList.toggle("home-mode",isHomeView);'), "detail and other internal pages cannot accidentally retain home layout");
  const popstateStart = app.indexOf('window.addEventListener("popstate"');
  const libraryClose = app.indexOf('if(!libraryView?.classList.contains("hidden"))', popstateStart);
  const navSync = app.indexOf("syncLunoActiveNavigation();", libraryClose);
  const restore = app.indexOf("restoreLunoHistoryPosition(state);", libraryClose);
  assert.ok(libraryClose >= 0 && navSync > libraryClose && navSync < restore, "navigation state is reconciled before scroll restoration");
});


test("poster rails use straight, untransformed poster edges", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.ok(!css.includes("clip-path:polygon(0 3%,100% 0,100% 100%,0 100%)"), "poster corners are not artificially clipped to create a tilt");
  assert.ok(css.includes("main>.section .cards>.card .card-art{border-radius:9px}"), "poster art keeps its normal rounded rectangle shape");
  assert.ok(!css.includes("main>.section .cards>.card .card-art{border-radius:9px;transform:rotate(-2deg)"), "poster images are not rotated as a whole");
});


test("home discovery begins directly after the hero without a duplicate divider gap", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.ok(!css.includes("  .home-hero{\n    min-height:0;height:clamp(310px,82vw,390px);"), "duplicate mobile hero sizing is removed");
  assert.ok(html.indexOf('id="homeHeroDots"') < html.indexOf("</section>", html.indexOf('id="homeHero"')), "carousel indicators stay inside the cinematic hero");
  assert.ok(css.includes(".discovery-section{margin-top:34px}"), "first discovery rail uses the compact mobile spacing rule");
  assert.ok(css.includes("height:72svh!important") && css.includes("justify-content:flex-end!important"), "mobile hero uses cinematic height with content anchored inside");
  assert.ok(html.includes('id="highRatedCards"') && html.includes('id="topMoviesCards"') && html.includes('id="topSeriesCards"'), "home includes the requested ranking rails");
  assert.ok(!html.includes('id="continueSection"'), "Continue Watching is not duplicated on Home");
  assert.ok(html.includes("<small>Я смотрю</small>"), "bottom navigation labels personal activity as Я смотрю");
});

test("home sections do not show decorative uppercase kicker labels", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const app = await readFile(new URL("app.js", root), "utf8");
  const home = html.slice(html.indexOf('id="trendingSection"'), html.indexOf('id="catalogSentinel"'));
  assert.ok(!home.includes('class="section-kicker"'), "home headings contain no decorative kicker labels");
  assert.ok(!home.includes('class="home-hero-eyebrow"'), "home hero has no decorative eyebrow label");
  for (const label of ["СЕЙЧАС СМОТРЯТ", "НА ВЕЧЕР", "ВЫБОР LUNO", "ПРОВЕРЕНО ВРЕМЕНЕМ"]) {
    assert.ok(!app.includes('kicker:"' + label + '"'), "removed kicker metadata for " + label);
  }
});


test("home keeps poster sizing and provides nine stable hero banners", async () => {
  const app = await readFile(new URL("app.js", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.ok(app.includes("length:Math.min(9,heroPool.length)"), "hero carousel has up to nine banners");
  assert.ok(app.includes("heroCycle*5"), "banner lineup changes on the two-day cycle");
  assert.ok(app.includes("Math.floor(Date.now()/(48*60*60*1000))"), "featured selection changes in a two-day cycle");
  assert.ok(app.includes("localStorage.getItem(heroStorageKey)"), "featured title is restored across reloads");
  assert.ok(app.includes("(Number(item.rating)||0)>=6.2"), "hero prefers well-rated titles with backdrop art");
  assert.ok(css.includes("grid-auto-columns:minmax(126px,38%)!important"), "poster sizing remains unchanged");
  assert.ok(css.includes("font-weight:560"), "hero actions use lighter typography");
  const heroRotation = app.slice(app.indexOf("function startHomeHeroRotation()"), app.indexOf("function homeHeroBackdrop(item)"));
  assert.ok(heroRotation.includes("},8000)"), "hero automatically changes banners every eight seconds");
  assert.ok(css.includes("aspect-ratio:2/3!important"), "poster art keeps consistent portrait ratio");
});


test("catalog replaces the old category hub with two selectable poster layouts", async () => {
  const app = await readFile(new URL("app.js", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.ok(app.includes('function renderLunoCatalog()'), "catalog has one dedicated renderer");
  assert.ok(app.includes("items.slice(0,lunoCatalogVisible)") && app.includes("lunoCatalogVisible=24"), "catalog paints a small first batch instead of every poster at once");
  assert.ok(app.includes("function bindCards(root=document)") && app.includes("bindCards(results)"), "poster event binding is scoped to the catalog batch");
  assert.ok(app.includes("lunoCatalogLoadMore") && app.includes("lunoCatalogVisible+=24"), "additional posters load in batches");
  assert.ok(app.includes('data-catalog-view="grid"') && app.includes('data-catalog-view="list"'), "both poster styles are selectable");
  assert.ok(app.includes("const landscape=String(item.background||item.backdrop||") && app.includes('poster_path:"",posterPath:""'), "catalog landscape cards prefer TMDB backdrop artwork when available");
  assert.ok(app.includes('data-catalog-sort="newest"') && app.includes('data-catalog-sort="rating"'), "newness and rating sorting are wired");
  assert.ok(app.includes('id="lunoCatalogGenre"'), "genre filter is present");
  assert.ok(app.includes('data-catalog-category'), "category tabs are interactive");
  assert.ok(app.includes('class="luno-catalog-sticky"><div class="luno-catalog-sticky-title">Каталог</div><div class="luno-catalog-tabs"'), "catalog title is integrated with sticky category tabs");
  assert.ok(app.includes('document.body.classList.add("library-open","catalog-open")'), "catalog retains its own screen state");
  assert.ok(css.includes(".luno-catalog-results.is-grid") && css.includes(".luno-catalog-results.is-list"), "grid and cinematic list styles are defined");
  assert.ok(css.includes("grid-template-columns:repeat(2,minmax(0,1fr))!important") && css.includes("body.catalog-open #lunoCatalogResults.luno-catalog-results.is-grid>.card .card-art"), "mobile poster grid is compact with clear spacing");
  assert.ok(css.includes("aspect-ratio:16/9!important") && css.includes("LUNO catalog experiment: landscape 16:9 cards"), "catalog grid can be previewed in landscape 16:9 without changing home posters");
  assert.ok(html.includes("./styles.css?v=211"), "compact catalog CSS has a fresh cache version");
  assert.ok(css.includes("body.catalog-open .mobile-tabbar"), "LUNO navigation remains visible on the catalog screen");
  assert.ok(css.includes("body.library-open.catalog-open #app>.mobile-tabbar.luno-reference-tabbar"), "catalog overrides the library screen tab-bar hide rule");
  assert.ok(html.includes("./styles.css?v=211"), "catalog navigation CSS has a fresh cache version");
  assert.ok(!app.includes("luno-catalog-intro"), "old tile-based category hub is removed");
  assert.ok(html.includes("./styles.css?v=211"), "new catalog CSS has a fresh cache version");
});


test("poster cards never use the disruptive neon focus frame", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.ok(css.includes("Remove the disruptive neon-lime focus frame"), "neon focus override is documented");
  assert.ok(css.includes(".card.tv-remote-focus") && css.includes("outline: 0 !important;"), "remote focus no longer draws an outline");
  assert.ok(css.includes("transform: none !important;"), "focused cards do not jump or scale");
  assert.ok(html.includes("./styles.css?v=211"), "updated stylesheet bypasses the browser cache");
});


test("mobile search discovery aligns below the search field and keeps navigation visible", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.ok(css.includes("Search screen: anchor discovery directly under the fixed field"), "reference-aligned search layout is defined");
  assert.ok(css.includes("top:170px!important"), "genre discovery sits directly below the fixed search field");
  assert.ok(css.includes("body.search-open .mobile-tabbar{\n    display:flex!important;"), "bottom navigation remains visible during search");
  assert.ok(html.includes("./styles.css?v=211"), "search layout uses the current stylesheet cache version");
});


test("mobile search field uses a slim centered width", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.ok(css.includes("left:12%!important;right:12%!important;"), "search field is narrower and centered");
  assert.ok(css.includes("height:52px!important;") && css.includes("border-radius:30px!important;"), "search field is slim with rounded corners");
  assert.ok(html.includes("./styles.css?v=211"), "slim search style uses a fresh cache version");
});


test("watch area exposes History first and Favorites second only", async () => {
  const app = await readFile(new URL("app.js", root), "utf8");
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.ok(app.includes('data-watch-tab="history"') && app.includes('data-watch-tab="favorites"'), "history and favorites tabs are wired");
  assert.ok(app.indexOf('data-watch-tab="history"') < app.indexOf('data-watch-tab="favorites"'), "history precedes favorites");
  assert.ok(app.includes('if(section==="library"){openLibrary("history");return;}'), "Я смотрю opens history first");
  assert.ok(html.includes("./app.js?v=watch-history-first"), "updated tab behavior bypasses the browser cache");
  assert.ok(html.includes("./styles.css?v=211"), "updated tab styling bypasses the browser cache");
});

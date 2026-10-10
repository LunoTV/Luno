// Development/CI fallback. The production catalog build replaces this module
// with the current TMDB dataset before Vite bundles the application.
export default {
  generatedAt: "development-fallback",
  source: "TMDB",
  language: "ru-RU",
  sections: {},
  items: []
};

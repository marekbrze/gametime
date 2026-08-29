// Stałe brandu/SEO — jedno źródło prawdy dla nazwy i opisu strony (nazwa
// produktu to open question z PROJECT.md; zmiana = ten plik + head w index.html).
// Statyczny head w index.html niesie meta dla crawlerów (HashRouter = jeden
// dokument); te stałe zasiliają tytuł karty per ekran (useDocumentTitle).
export const SITE_NAME = 'gametime';
export const SITE_URL = 'https://marekbrze.github.io/gametime';
export const DEFAULT_TITLE = 'gametime — sports schedule in your timezone';
export const DEFAULT_DESCRIPTION =
  'NHL, NBA, NFL, F1 and top soccer leagues in one calendar — times in your timezone, day/evening/night bands, watchlist and calendar export.';

// Tytuł karty per ekran: "Calendar — gametime"; bez argumentu — tytuł domyślny.
export function pageTitle(page?: string): string {
  return page ? `${page} — ${SITE_NAME}` : DEFAULT_TITLE;
}

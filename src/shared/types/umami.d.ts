// Typ minimalny dla trackera Umami ładowanego przez script.js (ADR-0036).
// Track ma trzy formy w API Umami; tu interesuje nas forma funkcyjna do
// nadpisania url przy hash-routerze (patrz UmamiPageviews).
declare global {
  interface Window {
    umami?: {
      track: (
        arg?:
          | string
          | ((props: Record<string, unknown>) => Record<string, unknown>),
        data?: Record<string, unknown>,
      ) => void;
    };
  }
}

export {};

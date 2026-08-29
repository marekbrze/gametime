import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Nawigacja do tej samej trasy nie zmienia pathname → efekt się nie odpala;
// kolejny track z tym samym pathname może przyjść tylko z remountu drzewa
// (zaobserwowany sporadycznie przy inicjalizacji HashRoutera). Wyciszamy go
// module-level dedupe — pełne przeładowanie strony resetuje stan i pageview
// słusznie się liczy od nowa.
let lastTrackedPath: string | undefined;

/**
 * Pageviewy Umami per trasa (ADR-0036). HashRouter nie zmienia pathname przy
 * nawigacji, więc domyślne auto-track widziałby cały ruch jako jeden URL —
 * w index.html wyłączone `data-auto-track="false"`, a ten komponent trackuje
 * każdą trasę (też pierwszą po wejściu) z URL-em routera (`/teams`, nie hash).
 * Deps tylko pathname: zmiany filtrów w search (ADR-0014) nie dublują pageviewów.
 */
export function UmamiPageviews() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === lastTrackedPath) return;
    lastTrackedPath = location.pathname;
    window.umami?.track((props) => ({ ...props, url: location.pathname }));
  }, [location.pathname]);

  return null;
}

# 0002 — Deploy na GitHub Pages

**Date**: 2026-08-24
**Module**: app-shell / infrastruktura
**Status**: Accepted

## Context
Prototyp musi mieć publiczny, udostępnialny URL. Hosting: statyczne GitHub Pages (zgodnie z constraint z PROJECT.md — narzędzie bez backendu). Build Vite przechodzi; repo `marekbrze/gametime` (publiczne) utworzone, branch `main`.

## Decision
- Deploy przez **GitHub Actions** (`actions/deploy-pages@v5`, source = workflow) na każdy push do `main`; artifact z `dist/`.
- `base: '/gametime/'` w `vite.config.ts` (project pages).
- **Scenariusz produkcyjny zablokowany na `empty`** — `getCurrentScenarioName()` w `src/scenarios/loader.ts` ignoruje localStorage w PROD. DevToolbar sam zwraca `null` w PROD (gate w komponencie).
- `cp dist/index.html dist/404.html` w workflow jako zabezpieczenie deep-linków — obecnie zbędne (HashRouter z ADR-0001), pozostawione na wypadek zmiany routera.
- Manualny fallback: `npm run deploy:manual` (`gh-pages -d dist` na branch `gh-pages`) — wymaga przełączenia Pages na "Deploy from a branch" w Settings.

## Impact
Każdy push do `main` redeployuje stronę na https://marekbrze.github.io/gametime/. Użytkownik końcowy widzi scenariusz `empty`, bez toolbara deweloperskiego i bez danych developera. Custom domain (CNAME) w przyszłości wymaga zdjęcia `base` z powrotem na `/`.

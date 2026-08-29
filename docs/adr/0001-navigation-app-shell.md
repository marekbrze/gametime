# 0001 — Nawigacja i struktura app shellu

**Date**: 2026-08-24
**Module**: app-shell
**Status**: Accepted

## Context
Trzeba zdefiniować, jak użytkownik nawiguje między modułami (MODULES.md: 4 destinationy nawigacyjne + 4 moduły nienawigacyjne) i jak wygląda rama aplikacji. Docelowy hosting: statyczne GitHub Pages; główni użytkownicy: kibice w niedopasowanej strefie czasowej, zarówno przy komputerze (planowanie), jak i na telefonie (rzut oka na dziś).

## Decision
- **Responsive**: top bar na desktopie + bottom tabs (4 pozycje) na mobile, przełączenie na breakpointcie `md`.
- **Home page**: brak — `/` przekierowuje na `/event-calendar` (happy path: od razu tydzień, zero setupu).
- **Etykiety/kolejność**: Kalendarz, Obserwowane, Drużyny, Ustawienia; UI po polsku.
- **Kontener treści**: responsive contained (`max-w-6xl`), bez breadcrumbs.
- **Shared**: header (nazwa + slot) oraz footer (źródła danych, GitHub); bez notyfikacji.
- **Routing**: `HashRouter` zamiast `BrowserRouter` — na GitHub Pages odświeżenie deep-linku pathowego (`/watchlist`) zwraca 404; hash routing unika tego bez hacków typu `404.html` + redirect. Koszt: `#/` w URL.
- **Scroll przy nawigacji** *(dodane później, sygnał z testów)*: zmiana pathname wraca na górę okna (efekt w `AppShell`) — bez tego przejście katalog lig → lista drużyn ligi dziedziczyło scroll punktu kliknięcia. Świadomie nie resetujemy na zmianie `search`: stan widoku w URL (ADR-0014: `?w`, `?band`, filtry) to wciąż ten sam ekran — strzałki tygodnia nie mogą wyrywać scrolla. Back/forward też zaczyna od góry (brak `ScrollRestoration` z data routerów — świadomy koszt hash routingu).

## Impact
Wszystkie ekrany z `proto-lofi` renderują się w tym shellu (`AppShell` w `src/shared/components/`). Nawigację między modułami obsługuje wyłącznie shell — moduły nie rysują własnych menu. Przejście na `BrowserRouter` możliwe później tylko ze zmianą hostingu (np. Netlify/Vercel z rewrite rules) — wówczas ten ADR do rewizji.

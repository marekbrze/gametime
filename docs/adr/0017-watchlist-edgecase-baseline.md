# 0017 - Watchlist edge-case baseline

**Date**: 2026-08-26
**Module**: watchlist
**Status**: Accepted

## Context

Moduł watchlist przeszedł `proto-lofi` (commit `de8313d`) — happy paths działają i są zweryfikowane
E2E, ale ekran nie był streszczany pod kątem przypadków brzegowych. Moduł nie ma własnego specu
z `proto-detail`; baseline'em wymagań były sekcje w MODULES.md / ACTIONS.md / ENTITY_MAP.md.

## Decision

Audyt przeprowadzony w `docs/modules/watchlist-edgecases.md`. Znalezione 14 gapów (🔴 1 · 🟡 8 · 🟢 5).
Priorytety:

1. Walidacja kształtu danych w localStorage (biały ekran dla parsowalnego, ale niewłaściwego JSON —
   odtworzone dla `gametime.settings = {}`; dotyka wszystkich ekranów, nie tylko watchlisty).
2. Lifecycle odgwiazdkowanych wydarzeń: canceled znika po cichu, postponed nie przenosi gwiazdki
   na nową instancję z feedu.
3. Sieroty poza oknem danych: częściowo niewidoczne, całkowicie — dead end bez akcji.
4. Widoczność "teraz": brak markera live na watchliście, żywe przejście upcoming → past znika
   w zwiniętej sekcji bez śladu.

## Impact

`proto-harden` wdroży listę priorytetową; przypadki produktowe (canceled/postponed/live/undo)
idą z pytaniami do designera, pozostałe są wdrażalne bezpośrednio. Po zmianach prototypu baseline
należy odświeżyć kolejnym przebiegiem `proto-edgecases`.

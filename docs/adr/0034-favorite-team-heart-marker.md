# 0034 - Serduszko = ulubiona drużyna, gwiazdka = obserwuj wydarzenie

**Date**: 2026-08-29
**Status**: Accepted

## Context

`FavoriteTeam` obiecywał od ENTITY_MAP „wyróżnienie jej wydarzeń na głównej liście", ale implementacja (`bg-muted/60` na neutralnym tle) była (1) zbyt subtelna jak na cel „widać jasno, gdzie są mecze, które mnie interesują", (2) wyłączona na płaskim terminarzu z tintem pasm (ADR-0032 iteracja 2 — tint zastępuje podświetlenie), (3) bez sygnału na poziomie skanu dnia. Dodatkowo gwiazdka oznaczała dwie różne rzeczy: watchlistę wydarzeń (wiersz) i ulubioną drużynę (moduł teams) — dokładnie to, przed czym GLOSSARY ostrzegał („ulubione" vs „obserwowane").

## Decision

Rozdzielenie semantyk ikonami — decyzja designera:

- **Serduszko (Heart, wypełnione, `text-brand-text`)** = ulubiona drużyna, globalnie: marker meczów ulubionych drużyn (EventRow/EventCard, przed etykietą uczestników — działa też na tintach pasm), afordancje ulubionej drużyny w teams (kafel, liga, header terminarza) i ikona filtra „My teams".
- **Gwiazdka (Star)** = wyłącznie obserwowanie wydarzenia (watchlista) — bez zmian.
- **Nagłówek dnia** (DayGroup): chip-licznik „N my teams" w tincie papayi (`bg-primary/12 text-brand-text`, słownictwo chipa SOON) obok chipów pasm — sygnał skanu dnia, widoczny na zwiniętych dniach przeszłych.
- Stary wash `bg-muted/60` usuwamy — serduszko jest jedynym nośnikiem (spójnym na każdym tle).
- Terminarz pojedynczej drużyny nie znaczy wierszy (każdy wiersz to „ta" drużyna — zmyłka; ta sama racja co ADR-0032 dla washu): `favorite={false}`.
- NowBlock bez serduszka w v1 (dwa chipy statusu wystarczą; trzeci element psułby „pół sekundy" z DESIGN.md).

Plan w `docs/changes/favorite-team-heart-marker.md`. Bez nowego modułu; event-calendar + teams + ikona w filters; watchlist dziedziczy marker bez zmian kodu.

## Impact

- Marker wraca na wszystkie powierzchnie list (także płaski terminarz watchlisty/PastSection i widok cards) z jednym spójnym nośnikiem.
- Kontrast: `text-brand-text` (oklch 0.47/0.12/44 light, 0.82/0.12/52 dark) — ta sama roda co gwiazdka watchlisty, ≥3:1 na tintach pasm w obu tematach; chip jak SOON.
- SR: „My team" jako tekst przy ikonie; chip nagłówka to widoczny tekst.
- Stories regresyjne + synchronizacja speców (event-calendar.md, teams.md, GLOSSARY, ACTIONS, ENTITY_MAP).

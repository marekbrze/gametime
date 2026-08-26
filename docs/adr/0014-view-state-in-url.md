# 0014 - stan widoku w URL (offset tygodnia + filtry w hash query)

**Date**: 2026-08-26
**Module**: filters
**Status**: Accepted

## Context

ADR-0010 odroczył luki #13 (Back button przy stronicowaniu tygodni) i #14 (deep-link do tygodnia) do modułu filters. Razem z decyzją o czystym starcie (ADR-0013) URL staje się jedynym nośnikiem stanu widoku — a cel społeczny z PROJECT.md ("umów się z kolegą z wyprzedzeniem") potrzebuje wysyłalnego linku do konkretnego widoku.

## Decision

- **Kontrakt**: `#/event-calendar?w=<offset>&band=<day|evening|night>&sport=<id>&league=<id,...>` — parametry w hash query (HashRouter), pomijalne gdy domyślne.
- **`w`** = offset tygodnia względem bieżącego tygodnia otwierającego (0 = this week), napędza WeekPager.
- **Historia**: każda zmiana widoku (paging, filtr) pushuje wpis — Back wraca po zmianach zamiast wychodzić z aplikacji (zamyka #13).
- **Deep-linki shareable**: URL w pełni odtwarza widok (zamyka #14); świeża wizyta bez parametrów = stan czysty; bookmark trzyma swój widok.
- **`myTeams` celowo poza URL** — ulubione są per-przeglądarka, link "only my teams" nie ma sensu u odbiorcy.
- **Parsowanie**: nieznane wartości ignorowane cicho (dany wymiar wraca do czystego); konflikty (`sport=hockey&league=premier-league`) rozstrzyga reguła uzgadniania z ADR-0012 (liga wygrywa, sport → All).

## Impact

Zamyka #13/#14 z ADR-0010. ACTIONS.md: pasywna akcja "Shareable view URL". `docs/modules/event-calendar.md`: integracja filters rozszerzona o stan w URL. Limitacja świadoma: `w` jako offset (nie data) postarza się w linkach długoterminowych — akceptowalne dla udostępniania krótkoterminowego; wróci w audycie proto-edgecases.

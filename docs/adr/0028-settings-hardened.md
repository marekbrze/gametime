# 0028 - Settings prototype hardened

**Date**: 2026-08-28
**Module**: settings
**Status**: Accepted

## Context

Ekran ustawień po lofi + audycie edge case'ów (ADR-0027): 6 gapów, w tym 🔴
biały ekran całej aplikacji przy śmieciowej wartości `timezone` w localStorage.

## Decision

Wdrożono 5/6 gapów z `docs/modules/settings-edgecases.md`:

1. **#1 (🔴) walidacja strefy w `sanitizeSettings`** — probe
   `Intl.DateTimeFormat` w try/catch; `""`/`"Foo/Bar"` → `'system'` zamiast
   RangeError na każdym ekranie (analogia do walidacji kształtu, ADR-0018).
2. **#2 (🟡) spójność pasm** — `isConsistentBands` wymaga modelu dwugranicznego
   (noc@0:00, wieczór@24:00, granice na siatce 30 min, zero luk/nakładek);
   niespójne → **defaults** (decyzja designera: snap do siatki odrzucony —
   ręczna edycja to zrzeczenie się intencji). Storage nietknięty do pierwszego
   zapisu (write-first bez zmian).
3. **#3 (🟡) option „Saved: {zone}"** — strefa poprawna dla Intl, ale nieobecna
   na liście (legacy aliasy `Poland`/`US/Pacific`), przypinana pod System
   default; select nigdy nie renderuje się pusty.
4. **#6 (🟢) kontrast podglądu pasm** — usunięte etykiety z segmentów paska
   (biały na amber ≈ 2.1:1, na sky ≈ 4.1:1 — poniżej AA); nazwy niosą legenda
   pod paskiem i aria-label. Kolory tokenów → proto-brand/proto-design.
5. **#4 (🟢) fallback `supportedValuesOf` zostaje 12 stref** — zaakceptowane
   bez zmiany kodu (decyzja designera: System default zawsze niesie rozpoznaną
   strefę).

Odroczone: **#5 multi-tab sync** (brak listenera `storage` w `useLocalStorage`)
— platformowe jak offline (ADR-0018/0024); dotyczy watchlisty i favorites, do
wdrożenia dla wszystkich modułów naraz.

## Impact

Każda ścieżka błędna ekranu ustawień zachowuje się przewidywalnie: storage z
ręcznie zepsutymi wartościami nigdy nie wywala aplikacji, aktywna strefa jest
zawsze widoczna, podgląd pasm przechodzi kontrast AA. Happy path bez zmian
(zweryfikowane E2E). Weryfikacja: harden 21/21 w chromium (garbage timezone ×
2, alias, gap/off-grid bands, write-first, regresja happy-path + 3 ekrany),
stories ×9 (4 nowe: InvalidTimezoneStorage, LegacyAliasTimezone,
InconsistentBands, OffGridBands). Wizualny szlif → przyszły cykl
proto-brand → proto-design → proto-polish.

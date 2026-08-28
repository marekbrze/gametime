# Settings — Edge Cases

Baseline po `proto-lofi` (commit 5899f12). Audyt: spec + kod + weryfikacja
eksperymentalna (node/Intl probe, E2E z lofi). **Harden (ADR-0028)**: 5/6
wdrożonych, 1 odroczony — patrz kolumna Status.

## Coverage

- **Spec already captured** (5): granice skrajne pasm · pad zapisu localStorage ·
  zepsuty kształt w storage · fallback `Intl.supportedValuesOf` · zmiana strefy
  a klasyfikacja pasm.
- **Already handled in code** (4, zweryfikowane E2E 21/21 w lofi):
  - granice skrajne + wzajemny clamp — `src/modules/settings/lib/band-boundaries.ts:51`
    (shiftBoundary), disabled na krańcach — `SettingsScreen.tsx:81`
  - pad zapisu → StorageWarning + rollback — `SettingsScreen.tsx:34` (wzorzec ADR-0011)
  - zepsuty kształt → `sanitizeSettings` scala z defaultami — `lib/sanitize.ts:10`
  - podgląd godzin w aktualnie wybranej strefie — `BandsPreview.tsx` (marker now)
- **Świadomie odroczone przez designera**: undo przy resecie (ADR-0026 — dialog
  zamiast toastu), viewMode na ekranie (ADR-0006) — NIE są gapami.
- **New gaps found**: 6
- **By severity**: 🔴 1 · 🟡 2 · 🟢 3

## Inventory

| # | Severity | Category | Edge case | Behavior today (baseline) | Decided behavior | Where | Status |
|---|----------|----------|-----------|---------------------------|------------------|-------|--------|
| 1 | 🔴 | Errors (cross-module) | Nieprawidłowa wartość `timezone` w storage (`""`, `"Foo/Bar"` — ręczna edycja / stara wersja) | `sanitizeSettings` przyjmuje KAŻDY string; `zonedParts` przekazuje go do `Intl.DateTimeFormat` → **RangeError na każdym ekranie aplikacji** (zweryfikowane: `""`/`"Foo/Bar"` → RangeError) | Walidacja wartości w `sanitizeSettings`: probe `Intl.DateTimeFormat` w try/catch; nieprawidłowa → `'system'` (analogia do walidacji kształtu, ADR-0018) | `src/modules/settings/lib/sanitize.ts:22` | ✅ ADR-0028 |
| 2 | 🟡 | Data states | Niespójne pasma z ręcznej edycji storage: luka/nakładka (`night.end ≠ day.start`), `start ≥ end`, wartości poza siatką 30 min (np. 0:45) lub poza dobą | Steppery czytają `night.end`/`evening.start`, podgląd renderuje SUROWE pasma → pasek z białą dziurą lub ujemną szerokością, odczyty niezgodne ze stepperami | **Defaults** (decyzja designera): `isConsistentBands` wymaga noc@0:00, wieczór@24:00, granice na siatce 30 min bez luk/nakładek; niespójne → `DEFAULT_SETTINGS.bands`; storage nietknięty do pierwszego zapisu | `src/modules/settings/lib/sanitize.ts:35` | ✅ ADR-0028 |
| 3 | 🟡 | Data states | Zapisana strefa poprawna dla Intl, ale NIEobecna na liście selecta (legacy aliasy: `Poland`, `US/Pacific` — `supportedValuesOf` zwraca 418 kanonicznych bez aliasów; zweryfikowane) | `select` z value bez dopasowanego optionu renderuje się pusty (selectedIndex −1) — user nie widzi aktywnej strefy | Przypięty option `Saved: {zone}` pod System default, gdy zapisanej strefy nie ma na liście — stan zawsze widoczny | `src/modules/settings/components/SettingsScreen.tsx:37` | ✅ ADR-0028 |
| 4 | 🟢 | Prototype-specific | Fallback `Intl.supportedValuesOf` (stare Safari) = krótka lista ręczna 12 stref — spec świadomie odroczył decyzję do tego audytu | Użytkownik starej przeglądarki może wybrać tylko 12 stref + System default (strefa rozpoznana działa poprawnie) | **Zostaje 12** (decyzja designera): System default zawsze niesie rozpoznaną strefę, fallback dotyczy tylko nadpisywania; rzadki przypadek, mniej kodu | `src/modules/settings/lib/timezones.ts:20` | ✅ zaakceptowane (bez zmiany) |
| 5 | 🟢 | Cross-module / lifecycle | Dwie karty przeglądarki: zmiana ustawień w karcie B nie odświeża karty A | `useLocalStorage` nie słucha zdarzenia `storage` — karta A trzyma stan w React do przeładowania; dotyczy też watchlisty i favorites (cross-cutting) | **Odroczone** (decyzja designera): platformowe jak offline (ADR-0018/0024) — dotyczy całego `useLocalStorage`, wdrożenie musi objąć wszystkie moduły naraz | `src/shared/hooks/use-local-storage.ts:14` | ❌ odroczone (platformowe) |
| 6 | 🟢 | Polish / a11y | Etykiety segmentów podglądu pasm: biały tekst na `bg-amber-500` ≈ 2.1:1 (sky ≈ 4.1:1) — poniżej AA dla normalnego tekstu | Segmenty podglądu miały `text-white` na BAND_DOT | Usunięte etykiety z segmentów (redundantne z legendą pod paskiem, która ma poprawny kontrast); pełny opis w aria-label, kolory tokenów → proto-brand/proto-design | `src/modules/settings/components/BandsPreview.tsx:53` | ✅ ADR-0028 |

### Kategorie sprawdzone bez gapów

- **Empty collection** — N/A: ustawienia zawsze mają wartości (sanitize domyka
  kształt), nie istnieje stan „brak ustawień".
- **Forms & input** — brak wolnotekstowych pól: select natywny (lista IANA),
  steppery natywne przyciski; podwójny klik nieszkodliwy (zapisy idempotentne).
- **Action outcomes** — success = write-first bez toastu (decyzja designera,
  ADR-0011); failure = StorageWarning + rollback; destructive = dialog;
  undo świadomie odrzucone przez designera (ADR-0026).
- **Loading & async** — brak ścieżek asynchronicznych (localStorage synchroniczny,
  marker now na `useNow(30s)`); skeleton niepotrzebny.
- **Navigation & flow** — ekran bezstanowy: deep-link/refresh przetrwane (E2E),
  dialog nie zostawia zawieszonego stanu, brak dead-endów (nawigacja stała).
- **Offline** — ekran w 100% lokalny, działa bez sieci.

## Priority list

1. **#1 nieprawidłowy `timezone` (🔴)** — jedyna droga do białego ekranu CAŁEJ
   aplikacji z jednej ręcznej edycji storage; naprawa tania (probe w sanitize),
   zasięg globalny (wszyscy konsumenci `useSettings`).
2. **#3 strefa spoza listy selecta (🟡)** — pusty select = aktywna strefa
   niewidoczna dla usera; częstsze niż się wydaje (legacy aliasy zapisane przez
   starsze wersje/inne narzędzia).
3. **#2 niespójne pasma (🟡)** — zepsuta geometria podglądu i odczyty niezgodne
   ze stepperami; ręczna edycja, ale sanitize już raz udowodnił, że warto
   domykać kształt (ADR-0018).
4. #4 fallback lista stref (🟢, decyzja designera) · #5 multi-tab (🟢,
   platformowe) · #6 kontrast etykiet (🟢, czeka na tokeny proto-design).

## Hand-off to proto-harden — rozstrzygnięte (ADR-0028)

Wdrożone w całości: **#1** (probe strefy w sanitize), **#2** (spójność pasm →
**defaults**, decyzja designera), **#3** (option „Saved: {zone}"), **#6**
(usunięte etykiety in-segment, kontrast AA). Decyzje designera: **#4** fallback
**zostaje 12** (zaakceptowane bez zmiany kodu), **#5** multi-tab **odroczone**
platformowo (analogia offline ADR-0018/0024). E2E harden 21/21 + regresja
happy-pathu w tym samym przebiegu.

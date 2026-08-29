# Teams — Edge Cases

Audyt `proto-edgecases` po `proto-lofi` (commit ecbbf54). **Zahardowane w `proto-harden` (ADR-0024) — status w kolumnie ✅/❌.** Zakres: cały moduł (3 ekrany + integracje z watchlist/calendar/filters/data-pipeline).

## Coverage
- **Spec already captured** (docs/modules/teams.md): off-season liga, sierota ulubiona, deep-link nieznany teamId/leagueId, deep-link F1, snapshot loading/error, zepsuty localStorage favorites, długa lista drużyn, długi sezon przeszłości.
- **Already handled in code (przed audytem)**:
  - off-season / brak wydarzeń → stan pusty z wyjaśnieniem (`TeamScheduleScreen.tsx`)
  - nieznany teamId/leagueId → not-found + Back to teams; F1 deep-link → nota + CTA na kalendarz (`LeagueScreen.tsx`)
  - loading → skeleton na wszystkich 3 ekranach, error → LoadError z retry
  - sanityzacja localStorage favorites (`use-favorite-teams.ts`)
  - Past zwinięte z licznikiem (`PastSection`), długa lista drużyn → search (`LeagueScreen.tsx`)
- **New gaps found**: 10 (+1 odroczone platformowe)
- **By severity**: 🔴 1 · 🟡 4 · 🟢 5
- **Po harden**: ✅ 10/10 · ❌ 0 (odroczony: offline w prod — platformowy)

## Inventory

| # | Severity | Category | Edge case | Behavior today (audyt) | Decided behavior (harden) | Where (po harden) | Status |
|---|----------|----------|-----------|------------------------|---------------------------|-------------------|--------|
| 1 | 🔴 | Prototype-specific | Zapis favorites pada (quota/private mode) | writeError bez konsumenta — ulubione ginęły w ciszy | StorageWarning na 3 ekranach (na terminarzu też watchlist/settings error); rollback wizualny z useLocalStorage | `TeamsScreen.tsx` / `LeagueScreen.tsx` / `TeamScheduleScreen.tsx` (storageFailed) | ✅ |
| 2 | 🟡 | Cross-module/lifecycle | Sierota ulubionej (teamId zniknęło ze snapshota) | Kafel po cichu znikał; mylący hint przy totalnym przypadku | Decyzja designera: nota „n favorites are outside the current data catalog" + Clear z undo 5s (wpisy wracają verbatim) | `TeamsScreen.tsx` (orphanedFavorites + handleClearOrphans) | ✅ |
| 3 | 🟡 | Navigation/URL | Obce `?sport`/`?league` zabijają terminarz niewidocznym filtrem | Invisible filtr → „No games match" bez wyjaśnienia | Decyzja designera: strip przy kanonizacji — `useUrlFilters({dimensions:'bands'})` czyta/pisze wyłącznie `?band` | `use-url-filters.ts` (FilterDimensions), `TeamScheduleScreen.tsx` | ✅ |
| 4 | 🟡 | Action outcomes | Od-ulubienie bez undo | Kafel znikał natychmiast, 3 efekty naraz | Decyzja designera: undo toast 5s na wszystkich 3 miejscach (kafel, wiersz ligi, nagłówek terminarza); wpis wraca verbatim z addedAt | `TeamsScreen.tsx` / `LeagueScreen.tsx` / `TeamScheduleScreen.tsx` + funkcyjne mutatory w `use-favorite-teams.ts` | ✅ |
| 5 | 🟡 | Cross-module | Nieznany uczestnik: surowe id jako link do gwarantowanego not-found | `TEAM_BY_ID.get(id)?.name ?? id` — id w UI | Zwykły tekst „Unknown team" bez linku; też w participantsLabel (wiersze list) | `EventDetailsDialog.tsx`, `event-labels.ts` | ✅ |
| 6 | 🟢 | Data states | Search wrażliwy na diakrytyki | „Atletico" nie znajdowało „Atlético" | fold: NFD + strip combining marks + lowercase | `LeagueScreen.tsx` (fold) | ✅ |
| 7 | 🟢 | Data states | Separator miesięcy tylko w Upcoming | Past bez kotwic miesiąca | `monthSeparators` w PastSection (terminarz włącza); formatMonthLabel w shared datetime | `PastSection.tsx`, `shared/lib/datetime.ts` | ✅ |
| 8 | 🟢 | Copy | „· data {range}" nieczytelne w EN UI | — | „Data range: {from} – {to}" | `TeamScheduleScreen.tsx` | ✅ |
| 9 | 🟢 | Data states | Duplikaty favoriteTeam w localStorage | Dwa identyczne kafle | Dedup po teamId w sanityzacji | `use-favorite-teams.ts` (sanitizeFavorites) | ✅ |
| 10 | 🟢 | Loading & async | Martwe `first:mt-0` w MonthSeparator | — | Usunięte | `TeamScheduleScreen.tsx` | ✅ |

**Odroczone (platformowe, poza modułem):** ❌ offline w prod — fetch `data.json` pada bez sieci → LoadError z retry; brak service workera (jak #13 z ADR-0018, decyzja platformowa).

**Bonus naprawione przy okazji harden (poza ewidencją):** hooks-order violation w TeamsScreen (useMemo/useCallback po early returnach — real-data ścieżka loading→ready crashowała render); mutatory favorites na closure'ach (undo po 5s czytało nieaktualny stan — ta sama lekcja co ADR-0018, przepisane na funkcyjne updatory).

**Categories bez gapów:** Forms & input (search bez walidacji, double-submit nie występuje), State transitions (FavoriteTeam binarne, bez maszyny), Errors (zero `alert()`, LoadError wszędzie), Loading skeletony obecne na 3/3 ekranów.

## Priority list
1. ~~#1 writeError~~ ✅
2. ~~#2 sieroty favorites~~ ✅
3. ~~#3 obce parametry URL~~ ✅
4. ~~#4 undo unfavorite~~ ✅
5. ~~#5 fallback id w dialogu~~ ✅
6. ~~#6–#10~~ ✅

## Hand-off to proto-harden
Wykonane w całości (ADR-0024). E2E: harden 20/20 + regresja teams 43/43 + regresja app 4/4.

## Dodatek po ADR-0032 (płaski terminarz, 2026-08-29)

| # | Stan | Kategoria | Gap | Zaczerpnąty stan | Zachowanie po harden | Plik |
|---|------|-----------|-----|------------------|----------------------|------|
| 11 | ✅ | Data states | Grupy dni + separatory miesięcy zagęszczały terminarz (sygnał designera) | DayGroup per ViewingDay | płaska lista chronologiczna z datą w wierszu („Sat"/„Sep 6", „Today" dla bieżącego) | `TeamScheduleScreen.tsx` |
| 12 | ✅ | Navigation | Nocne mecze: ViewingDay w płaskiej liście traci sens | grupa „after midnight" wczorajszego wieczoru | chronologia po starcie + data faktyczna (czwartek 01:30 po środzie) | `TeamScheduleScreen.tsx` (ADR-0032) |
| 13 | ✅ | Filters | `?band=night` na płaskiej liście | — | zawęża listę, daty/kolejność bez zmian | `TeamScheduleScreen.tsx` |
| 14 | ✅ | Layout | Kolumna daty na 375 px | — | dwie linie caption w w-14, liga dalej ukrywana poniżej sm jak dotąd | `EventRow.tsx` (dateLabel) |
| 15 | ✅ | Data states | Past w terminarzu po spłaszczeniu | DayGroupy w sekcji Past | wariant `flat` PastSection — chronologia od najnowszych z datami | `PastSection.tsx` |

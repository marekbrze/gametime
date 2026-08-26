# Teams — Edge Cases

Audyt `proto-edgecases` po `proto-lofi` (commit ecbbf54). Zakres: cały moduł (3 ekrany + integracje z watchlist/calendar/filters/data-pipeline).

## Coverage
- **Spec already captured** (docs/modules/teams.md): off-season liga, sierota ulubiona, deep-link nieznany teamId/leagueId, deep-link F1, snapshot loading/error, zepsuty localStorage favorites, długa lista drużyn, długi sezon przeszłości.
- **Already handled in code**:
  - off-season / brak wydarzeń → stan pusty z wyjaśnieniem (`TeamScheduleScreen.tsx:150`)
  - nieznany teamId → not-found + Back to teams (`TeamScheduleScreen.tsx:104`); nieznana liga analogicznie (`LeagueScreen.tsx:31`)
  - F1 deep-link → nota + CTA na kalendarz (`LeagueScreen.tsx:44`)
  - loading → skeleton (`TeamsSkeleton` na wszystkich 3 ekranach), error → LoadError z retry
  - sanityzacja localStorage favorites (`use-favorite-teams.ts:9`)
  - Past zwinięte z licznikiem (`PastSection`), długa lista drużyn → search (`LeagueScreen.tsx:27`)
- **New gaps found**: 10 (+1 odroczone platformowe)
- **By severity**: 🔴 1 · 🟡 4 · 🟢 5

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | 🔴 | Prototype-specific | Zapis favorites do localStorage pada (quota/private mode) | `writeError` exposowany przez hook, ale żaden ekran teams go nie czyta — gwiazdka świeci, ulubione giną po odświeżeniu w ciszy | StorageWarning jak na watchliście (ADR-0018): baner na wszystkich 3 ekranach teams | `use-favorite-teams.ts:35` (expose), brak konsumenta w `TeamsScreen.tsx`, `LeagueScreen.tsx`, `TeamScheduleScreen.tsx` |
| 2 | 🟡 | Cross-module/lifecycle | Sierota ulubiona (teamId zniknęło ze snapshota) | Kafel po cichu znika; przy totalnym przypadku My teams (0) + hint „Star teams from a league…" sugeruje, że user nic nie oznaczał | Parity z sierotami watchlisty (ADR-0018 #4): nota „n favorites are outside the current data catalog" + opcja Clear | `TeamsScreen.tsx:33-35` (filter Boolean) |
| 3 | 🟡 | Navigation/URL | Obcy parametr URL na terminarzu: `?sport=soccer` na drużynie NHL | Invisible filtr zabija całą listę („No games match"), przyczyna niewidoczna — bandsOnly nie renderuje selecta sportu, więc nie widać co wyczyścić; Clear filters ratuje, ale user nie wie po co | Strip parametrów sport/league na wejściu ekranu (analogia do `?w` na watchliście, ADR-0018 #11) — `useUrlFilters` z opcją wymiarów | `TeamScheduleScreen.tsx:34` (`useUrlFilters({week:false})` bez ograniczenia), `use-url-filters.ts:52` (toSearchParams emituje sport/league) |
| 4 | 🟡 | Action outcomes | Od-ulubienie bez undo | Kafel znika natychmiast; efekty uboczne (podświetlenia na kalendarzu, My teams filter) znikają bez powrotu | Undo toast 5s jak odgwiazdkowanie watchlisty (ADR-0018 #6) — zwłaszcza że akcja dotyka trzech zachowań naraz | `TeamsScreen.tsx:79` (toggle w kaflu), `LeagueScreen.tsx`/`TeamScheduleScreen.tsx` (gwiazdki) |
| 5 | 🟡 | Cross-module | Link uczestnika w dialogu, gdy drużyna nie jest w katalogu | Fallback pokazuje surowe id (np. `espn-nhl-9999`) jako klikalny link prowadzący na gwarantowany not-found | Nieznany team → zwykły tekst (bez linku), id nigdy nie ląduje w UI | `EventDetailsDialog.tsx:137` (`TEAM_BY_ID.get(id)?.name ?? id`) |
| 6 | 🟢 | Data states | Search wrażliwy na diakrytyki | „Montreal" nie znajdzie „Montréal" (includes na surowych stringach) | Normalizacja NFD + strip znaków diakrytycznych przed porównaniem | `LeagueScreen.tsx:27` |
| 7 | 🟢 | Data states | Separator miesięcy tylko w Upcoming | Skończony sezon: rozwinięte Past to setki grup dni bez żadnej kotwicy miesiąca | Te same separatory w PastSection (prop/od within section) | `TeamScheduleScreen.tsx:186-207` (separatory tylko w pętli upcoming), `PastSection.tsx:56` |
| 8 | 🟢 | Copy | Zakres danych w podtytule: „· data Sep 15, 2026 – Jul 1, 2027" | „data" czyta się nieporadnie w angielskim UI | „Data range: {from} – {to}" albo „Season data: …" | `TeamScheduleScreen.tsx:114` |
| 9 | 🟢 | Data states | Zduplikowane wpisy favoriteTeam w localStorage (ręczna edycja) | Sanitizer nie deduplikuje → dwa identyczne kafle; toggle usuwa oba naraz | Dedup po teamId w sanityzacji | `use-favorite-teams.ts:9-17` |
| 10 | 🟢 | Loading & async | Separator miesiąca `first:mt-0` martwe | MonthSeparator jest zawsze first-child swojego wrappera → `first:` nigdy nie odróżnia pierwszego separatoru | Usunąć `first:mt-0` albo porównać z poprzednim elementem | `TeamScheduleScreen.tsx:239` |

**Odroczone (platformowe, poza moduł):** offline w prod — fetch `data.json` pada bez sieci → LoadError z retry; brak service workera (jak #13 z ADR-0018, decyzja platformowa).

**Categories bez gapów:** Forms & input (search bez walidacji, double-submit nie występuje), State transitions (FavoriteTeam binarne, bez maszyny), Errors (zero `alert()`, LoadError wszędzie), Loading skeletony obecne na 3/3 ekranów.

## Priority list
1. **#1 writeError** — jedyny 🔴: cicha utrata danych usera; naprawa tania (jeden baner, hook już expose'uje).
2. **#2 sieroty favorites** — buduje się na wzorcu sierot watchlisty (ADR-0018 #4), spójność cross-module.
3. **#3 obce parametry URL na terminarzu** — strip przy kanonizacji, analogia ?w (mały, zamyka klasę mylących deep-linków).
4. **#4 undo unfavorite** — parity z undo watchlisty; decyzja designera czy full parity czy tylko kafel My teams.
5. **#5 fallback id w dialogu** — 3 linijki, usuwa brzydki dead-end.
6. #6–#10 po drodze (search diakrytyki, separatory w Past, copy, dedup, first:mt-0).

## Hand-off to proto-harden
Zaimplementować w tej kolejności; przy #2, #4 i #3 zapytać designera o kształt (rekomendacje wyżej to default). Po harden — odświeżyć baseline.

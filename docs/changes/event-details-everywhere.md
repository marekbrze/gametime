# Feature: Szczegóły meczu wszędzie — dialog z watchlisty na każdej liście + klikalne ligi

## Type
Feature (planned by proto-feature)

## User goal
„Na liście watchlist są fajne modale z informacjami o meczu. One powinny być na każdej liście meczów i powinny być klikalne nazwy lig itp." — szczegóły wydarzenia (data/godzina, liga, pasmo, status, eksporty, link do uczestników) to zdolność listy, nie własność watchlisty; dziś działa tylko tam.

## Decyzje designera ( defaults przy goal-mode)
1. **Dialog = własność event-calendar** (słownictwo prezentacji wydarzeń: EventRow/EventCard/DayGroup/event-labels). Modyfikuje punkt 2 ADR-0022 („komponent pozostaje własnością modułu watchlist") — racja: konsumenci to teraz wszystkie trzy ekrany list.
2. **Klik w etykietę uczestników otwiera dialog** na każdej liście (kalendarz, terminarz drużyny, watchlista, PastSection obu wariantów, NowBlock). Afordancja jak dotychczas na watchliście: hover/focus underline.
3. **Nazwa ligi klikalna wszędzie, gdzie występuje**: dialog (rzząd League), EventRow, EventCard, NowBlock, header terminarza drużyny → `/teams/league/:leagueId`. Liga poza katalogiem → zwykły tekst (zasada ADR-0024: link do gwarantowanego not-found nie ląduje w UI).
4. **„Watch new date" działa z każdej listy**: gwiazdka przenosi się na nową instancję (remove+add); jeśli wydarzenie nie było obserwowane — po prostu gwiazdkuje nowy termin. Feedback toastem jak na watchliście.
5. F1 w dialogu: link do ekranu ligi (ten ma własne wyjaśnienie + link do kalendarza) — bez rozgałęzienia zasad.

## MVP scope
**Musi działać:**
1. `EventDetailsDialog` przeniesiony do `event-calendar/components/`; `findRescheduled` do `data-source/lib/reschedule.ts` (semantyka feedu, obok `status.ts`); watchlist importuje z nowych miejsc, zachowanie bez zmian.
2. Kalendarz tygodnia (`EventCalendarScreen`): DayGroup → wiersze/karty otwierają dialog; NowBlock — etykieta uczestników klikalna (dialog); migracja gwiazdki z toastem.
3. Terminarz drużyny (`TeamScheduleScreen`): wiersze/karty (upcoming + PastSection flat) otwierają dialog; migracja z toastem (infra istnieje).
4. PastSection wariant flat przekazuje `onOpenDetails` do wierszy/kart (dziś tylko tryb grupowany).
5. `LeagueLink` — współdzielony komponent (Link do ekranu ligi albo zwykły tekst dla id poza katalogiem) użyty w dialogu, EventRow, EventCard, NowBlock i headerze terminarza.
6. Stories regresyjne + synchronizacja speców (docs/modules).

**Later (odłożone):**
- Deep-link do otwartego dialogu w URL (zamykanie Backiem).
- Link pasma/daty w dialogu (np. do settings); „itp." domknięte ligami i uczestnikami.
- Serduszko w NowBlock (ADR-0034 Later — bez zmian).

## Impact map
- **New module?**: nie — rozszerza event-calendar (dialog + LeagueLink), teams (wiring + header), watchlist (delegacja importu).
- **Modules affected**: event-calendar (własność dialogu, LeagueLink, NowBlock), teams (TeamScheduleScreen wiring, header link), watchlist (import dialogu z event-calendar, reschedule z data-source; zero zmian logiki).
- **Cross-module integration**: ryzykowny punkt = semantyka `onMigrate` na listach, gdzie wydarzenie może nie być obserwowane (decyzja 4) + JEDNA instancja `useWatchlist` na ekran (brak synchronizacji między instancjami `useLocalStorage` — migrate musi iść przez ten sam hook, który zasila gwiazdki wierszy).
- **Shared-doc additions**: ACTIONS.md („Jump to event" promowane ze watchlisty na każdą listę + „Open league page"), GLOSSARY (bez nowych terminów — League/EventDetails istnieją), ENTITY_MAP bez zmian.

## Per-module changes

### event-calendar
- **Data**: brak zmian encji.
- **Actions**: Open event details (z każdej listy); Watch new date (migracja) — dotąd tylko watchlista.
- **Screens & flows**: EventCalendarScreen: `detailsEvent` + `handleMigrate` (jedna instancja useWatchlist), DayGroup/NowBlock dostają `onOpenDetails`. NowBlock: etykieta uczestników zostaje przyciskiem (underline jak w wierszach), liga → LeagueLink.
- **States**: bez nowych stanów pustych/błędów — dialog istnieje, zamykanie natywnym `close` (idiom focus-return).
- **Edge cases**: (a) postponed z nową instancją poza oknem danych → `findRescheduled` zwraca null, sekcja Rescheduled nie renderuje się (istniejące); (b) migrate na nieobserwowanym wydarzeniu → gwiazdka ląduje na nowym terminie; (c) Escape/tło/× z każdej listy — natywne, bez zmian.
- **Design**: LeagueLink dziedziczy `text-xs text-muted-foreground` wiersza; underline-offset-2 hover:underline focus-visible:underline (słownictwo linków ADR-0022). Dialog bez zmian wizualnych poza linkiem ligi.

### teams
- **Data/Actions**: brak zmian logiki.
- **Screens & flows**: TeamScheduleScreen — dialog + migrate (toast infra istnieje); header: nazwa ligi pod nagłówkiem drużyny → LeagueLink.
- **States/Edge cases**: bez nowych; uczestnicy w dialogu na terminarzu tej samej drużyny → nawigacja do siebie/drugiej drużyny (użyteczne, bez guardu).

### watchlist
- **Screens & flows**: import `EventDetailsDialog` z event-calendar, `findRescheduled` z data-source. Zero zmian zachowania.

### data-source
- **Data**: nowy plik `lib/reschedule.ts` (przeniesiona czysta funkcja `findRescheduled` — semantyka feedu: statusOverride/teamIds/leksykograficzne ISO).

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 1 | (bez skilla — residual) | src/modules/{event-calendar,teams,watchlist,data-source} | zmiana wiring/prezentacji na istniejących ekranach, bez nowych stanów — direct edits wg listy poniżej |
| 2 | (direct edit) | docs/modules/*.md, ACTIONS.md | synchronizacja speców |
| 3 | (direct edit) | *.stories.tsx | stories regresyjne: dialog z kalendarza i terminarza, link ligi |
| 4 | weryfikacja | — | `npm run build`, `npm run lint`, vitest storybook (workaround fontconfig z memory), przegląd w przeglądarce |

proto-edgecases/harden nieroutingowane: cecha nie dodaje nowych stanów ani ścieżek — dialog i jego stany istnieją (harden ADR-0018), domyka się w istniejących.

## Residual — direct edits not covered by a proto skill
- **[`src/modules/watchlist/components/EventDetailsDialog.tsx`]** — now: własność watchlist, import `../lib/reschedule`, League jako tekst. change to: przenieść do `src/modules/event-calendar/components/EventDetailsDialog.tsx`; import `findRescheduled` z `@/modules/data-source/lib/reschedule`; rzząd League → `LeagueLink` (font-medium). why: współdzielenie przez 3 ekrany + klikalna liga.
- **[`src/modules/watchlist/lib/reschedule.ts`]** — przenieść (verbatim, z doc comment) do `src/modules/data-source/lib/reschedule.ts`. why: czysta semantyka feedu, konsument poza watchlist.
- **[NEW `src/modules/event-calendar/components/LeagueLink.tsx`]** — Link do `/teams/league/:id` gdy liga w katalogu, inaczej span; className przekazywany (dziedziczy styl wiersza).
- **[`src/modules/event-calendar/components/EventRow.tsx:96-98`]** — league span → LeagueLink (klasy bez zmian).
- **[`src/modules/event-calendar/components/EventCard.tsx:111`]** — leagueName inline → LeagueLink.
- **[`src/modules/event-calendar/components/NowBlock.tsx:14-18,53-79`]** — props `onOpenDetails?`; etykieta uczestników → przycisk (underline idiom); league span → LeagueLink.
- **[`src/modules/event-calendar/components/EventCalendarScreen.tsx:36,210-221,152`]** — destrukturyzacja `entries, add, remove` z useWatchlist; `detailsEvent`/`handleMigrate`(+toast WatchlistToast)/dialog; DayGroup + NowBlock dostają `onOpenDetails`.
- **[`src/modules/teams/components/TeamScheduleScreen.tsx:36,101-104,159-163,245-292`]** — `detailsEvent`/`handleMigrate`(toast istnieje)/dialog; `onOpenDetails` na EventRow/EventCard + PastSection; header league → LeagueLink.
- **[`src/modules/watchlist/components/PastSection.tsx:58-92`]** — flat: EventRow/EventCard dostają `onOpenDetails` (paritet z trybem grupowanym).
- **[`src/modules/watchlist/components/WatchlistScreen.tsx:19`]** — import dialogu z event-calendar.
- **Specs**: docs/modules/event-calendar.md, teams.md, watchlist.md; ACTIONS.md „Jump to event" (każda lista) + „Open league page".

## Later (deferred)
- URL deep-link otwartego dialogu.
- Linki pasm/daty w dialogu.

## Hand-off
Implementacja bezpośrednio z listy residual, potem stories + weryfikacja. ADR-0035 notuje decyzje (własność dialogu, semantyka migrate, LeagueLink).

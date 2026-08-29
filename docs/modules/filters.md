# filters

Wynik `proto-detail`. Moduł Supporting (wysoki priorytet) — wspólny pasek filtrowania na każdej liście aplikacji.

## Vision

Dwie decyzje mają znaczenie przy każdej wizycie: **która pora dnia** i **który sport** — te dwa wymiary są zawsze widoczne na pasku, duże i dostępne jednym kliknięciem. Wszystko pozostałe (ligi) jest schowane za przyciskiem **More filters**, żeby pasek nie wyglądał jak panel ustawień. Zero pamięci: każda wizyta zaczyna od czystego stanu ("All sports, any time") — użytkownik nigdy nie wraca z pytaniem "czemu nie widzę meczów NHL". Jedyny nośnik stanu, który przeżywa wizytę, to **URL**: każdy przefiltrowany widok da się wysłać koledze (cel społeczny z PROJECT.md).

## User Flows

### Szybkie zawężenie (happy path)
1. User otwiera `/event-calendar` → pasek w stanie czystym: pasmo "Any time", sport "All sports", More filters bez licznika
2. Klika chip pasma (np. Evening) → lista natychmiast zawężona; URL dostaje `band=evening`
3. Opcjonalnie wybiera sport z selecta (np. 🏒 Hockey) → URL `sport=hockey`
4. Licznik na More filters się nie zmienia — sport i pasmo to tier 1, widoczne na pasku; licznik zlicza tylko wybory z tieru 2 (ligi)

### Ligi w More filters
1. User klika **More filters** → otwiera się panel z checkboxami lig
2. Lista jest **pogrupowana nagłówkami sportów** (⚽ Football → Premier League, Serie A, …) — hierarchia widoczna od razu, bez wymuszania kaskady (Serie A dostępna bez wcześniejszego wybierania Football)
3. Zaznacza **Premier League + Bundesliga** (multi-select) → zamyka panel
4. Badge na przycisku pokacza liczbę wybranych lig; URL `league=premier-league,bundesliga`

### Uzgadnianie sport × liga
Sport i ligi to dwa widoki jednego stanu — uzgadniają się automatycznie, żeby nie powstał martwy AND (hokej + Serie A):
1. Wybór konkretnego sportu → **odznacza ligi innych sportów**
2. Zaznaczenie ligi z innego sportu niż wybrany → **sport przeskakuje na "All sports"**
3. Odznaczenie ostatniej ligi → sport pozostaje wybrany (filtr wraca na poziom sportu)

### Cofnięcie i udostępnienie (URL)
1. User przewija tygodnie (pager) i/lub zmienia filtry → każda zmiana widoku **pushuje wpis historii**
2. **Back** wraca do poprzedniego widoku (poprzedni tydzień / wcześniejsze filtry) — nie wychodzi z aplikacji (zamyka #13 z ADR-0010)
3. Kopiuje URL → kolega otwiera dokładnie ten widok: `#/event-calendar?w=1&band=evening&league=premier-league` (zamyka #14 z ADR-0010)
4. Świeża wizyta bez parametrów → stan czysty; bookmark z parametrami trzyma swój widok (URL to jedyna "pamięć" filtrów)

### Czyszczenie
1. Kombinacja filtrów daje zero wyników → inline empty state "No matches for these filters" + przycisk **Clear filters**
2. Clear filters → pełny reset do stanu czystego (URL gubi parametry, licznik znika, lista wraca do pełnej)

## Screens (rough)

- **FilterBar** (wspólny element nad każdą listą): tier 1 — chipsy pasm (Any time / Day / Evening / Night), select sportu (z suffixem "— no events" dla off-season, ADR-0011), toggle My teams (disabled bez ulubionych), przycisk **More filters · N**. View-mode toggle (list ↔ cards) pozostaje własnością event-calendar, nie tego modułu. Na **<768 px pełny wariant zwija się do przycisku "Filters · N"** (N = aktywne wymiary: pasmo+sport+ligi+My teams); view-mode zostaje na wierzhu; panel rozwija się inline (ADR-0033). Wariant bands-only nie zwija się (mieści się w jednym wierszu 375 px).
- **More filters panel**: checkboxy lig pogrupowane po sportach; dokładna powierzchnia (popover desktop / bottom sheet mobile) i moment stosowania (natychmiast vs Apply) — decyzja proto-lofi.
- **FilteredEmptyState** (element listy): "No matches for these filters" + Clear filters — odrębny wariant od off-season i beyond-window (ADR-0011).

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| Filter by band | Chipsy pasm; single-select z "Any time" | `TimeBand` | Tier 1, zawsze widoczne |
| Filter by sport | Select z "All sports"; single-select | `Sport` | Tier 1; off-season suffix (ADR-0011) |
| Filter by league | Multi-select w More filters, pogrupowane po sportach | `League` | Uzgadnianie ze sportem — ADR-0012 |
| Toggle "only my teams" | Przełącznik na pasku | `FavoriteTeam` | Disabled bez ulubionych; poza URL |
| Clear filters | Reset wszystkiego do stanu czystego | — | W empty state zero-match — ADR-0013 |
| (pasywnie) Shareable view URL | Filtry + offset tygodnia w hash query | — | ADR-0014; nośnik celu społecznego |
| (pasywnie) Back through history | Stronicowanie/zmiana filtra pushuje historię | — | Zamyka #13/#14 z ADR-0010 |

## Edge Cases

- **Zero match po filtrach**: inline empty state + Clear filters — świadomie odrębny od wariantów off-season i beyond-window (ADR-0011); to jedyny empty state z CTA resetu.
- **Beyond-window dominuje nad filtrami** (ADR-0016): deep-link typu `?w=30&league=nhl` pokazuje "No data for this week" + notę o oknie, nie "nie pasuje do filtrów" — brak danych to silniejszy powód pustki niż zawężenie.
- **Off-season lig**: analogicznie do sportów — ligi bez wydarzeń w oknie danych dostają suffix "— no events" w panelu (opcja nieblokująca).
- **Martwy AND sport × liga**: niemożliwy dzięki regułom uzgadniania (wybór sportu odznacza obce ligi; obca liga przestawia sport na All); przy wybranym sporcie panel pokazuje podpowiedź o tym efekcie (ADR-0016).
- **Filtry obowiązują cały ekran listy** (decyzja designera, ADR-0016): blok Now czyta ten sam predykat co lista tygodnia — filtrowanie do piłki znika live NBA ze szczytu; pusty zbiór = blok Now znika.
- **Skrajny przypadek paska na innych listach**: SeasonSchedule drużyny ma sport/ligę ustalone przez drużynę → pasek zredukowany do samych pasm (MyTeams bez sensu na liście jednej drużyny); watchlist dostaje pełny pasek.
- **Zwijanie na mobile** (ADR-0033): <md pełny pasek schowany za "Filters" — deep-link z aktywnymi filtrami startuje rozwinięty (złoty filtr widać, nie domyślny); stan `open` to czysta prezentacja, nie ląduje w URL; breakpoint md zbieżny z drawerem More filters.
- **Nieprawidłowe wartości w URL** (nieznane id ligi/sportu, zły band): ignorowane cicho, dany wymiar wraca do czystego — nie errorujemy użytkownika linkiem; URL jest przy tym kanonizowany replace'em na wejściu (konflikty/duplikaty nie wiszą w pasku adresu).
- **Powtórzone parametry** `?league=nhl&league=nba` scalane w jeden wybór (ADR-0016).
- **`?w=` clamp do ±52** tygodni — absurdalne deep-linki nie generują absurdalnych dat (ADR-0016).
- **Historia: coalescing rapid changes** (ADR-0016, precyzja ADR-0014): pierwsza zmiana widoku pushuje wpis, kolejne w <500 ms replace'ują — Back wraca po stanach widoku, nie po pojedynczych tickach checkboxów.
- **Filtry w obrębie wizyty przy zmianie taby**: taba Calendar wraca z ostatnim query kalendarza (pamięć AppShell, w obrębie sesji); świeża wizyta nadal zaczyna czysto (ADR-0013).
- **SR**: zawężenie listy ogłaszane `aria-live` (liczba widocznych wydarzeń) — filtr nie jest ciszą dla czytników (ADR-0016).
- **URL a świeżość**: `w` to offset względem *bieżącego* tygodnia otwierającego, nie data — link "next week" postarza się o tydzień; akceptowalne dla udostępniania krótkoterminowego.
- **Filtr vs scenariusze dev**: scenariusze DevToolbar żyją w localStorage, parametry widoku w hash — nie kolidują.

**Odroczone** (ADR-0015/0016): dryf katalogu statyczny vs snapshot → moduł data-source (`registerCatalogTeams` rozszerzone o sports/leagues); mock/dev bez DataWindow → zakres event-calendar; resize md-boundary z otwartym panelem → zaakceptowane.

## Integration Points

- **event-calendar**: FilterBar zastępuje `MiniFilterBar` (całość, łącznie z zachowaniami z ADR-0011); view-mode toggle zostaje na miejscu; `w` w URL napędza WeekPager.
- **watchlist**: ten sam FilterBar nad listą (nadchodzące/past to sekcje listy — filtr działa w ich obrębie)
- **teams**: SeasonSchedule z paskiem zredukowanym do pasm; ulubione drużyny zasiliają toggle My teams
- **settings**: zakresy `TimeBand` stąd napędzają klasyfikację pasmową i chipsy
- **data-source**: katalog sportów/lig (ids stabilne — użyte w URL)

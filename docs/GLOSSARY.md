# Domain Glossary

Terms and concepts specific to this project. Used across all project skills to maintain a consistent language.

| Term | Code Name | Definition | Avoid saying |
|------|-----------|------------|--------------|
| Wydarzenie | `SportEvent` | Pojedyncze rozgrywane wydarzenie sportowe: sport, liga, uczestnicy, data i godzina (z strefą). W motorsporcie — pojedyncza sesja (wyścig, kwalifikacje, trening), zobacz open question o granularity. W kodzie `SportEvent`, nie `Event` (kolizja z globalnym typem DOM). | "mecz" jako termin ogólny (meczem jest tylko wydarzenie zespołowe) |
| Sport | `Sport` | Najwyższy poziom hierarchii informacji: hokej, koszykówka, futbol amerykański, baseball, piłka nożna, motorsport, siatkówka. Nadrzędny wobec ligi — użytkownik filtruje najpierw po sporcie. | "kategoria", "dyscyplina" (ostatnia poprawna językowo, ale w kodzie `Sport`) |
| Liga | `League` | Seria rozgrywkowa w ramach sportu: NBA, NHL, NFL, Ekstraklasa… W motorsporcie rolę ligi pełni seria wyścigowa (F1, NASCAR, WRC) — jeden poziom hierarchii, jedna nazwa w kodzie. | "seria" (potocznie OK dla motorsportu; w UI angielskie League — ADR-0003) |
| Drużyna | `Team` | Uczestnik zespołowy wydarzenia; ma własny pełny terminarz sezonu dostępny z nawigacji. | "klub", "zespół" (w UI angielskie Team — ADR-0003) |
| Pasmo godzinowe | `TimeBand` | Jeden z trzech konfigurowalnych przedziałów doby, rozróżnianych kolorem; służy do filtrowania i wizualnej klasyfikacji wydarzeń "da się obejrzeć" vs "w nocy". | "kategoria godzinowa", "przedział" |
| Dzień / Wieczór / Noc | `DayBand` / `EveningBand` / `NightBand` | Trzy pasma; zakresy domyślne: dzień 6:00–22:00, wieczór 22:00–24:00, noc 0:00–6:00. Zakresy przełączalne przez użytkownika. Klasyfikacja po czasie startu. | "rano/południe" (nie ma takiego pasma) |
| Dzień widokowy | `ViewingDay` | Doba zorganizowana wokół wieczoru: wydarzenia 0:00–6:00 (Night) należą na listach do wieczoru dnia poprzedniego ("Tuesday after midnight" domyka wtorek). | "dzień kalendarzowy" |
| Blok Now | `NowBlock` | Szczyt listy: trwające wydarzenia (LIVE, elapsed od startu) + startujące w ≤60 min (countdown). Wyliczane z czasu startu — bez realtime API. | "live score", "wynik na żywo" |
| Strefa czasowa | `Timezone` | Strefa, w której prezentowane są wszystkie godziny wydarzeń; domyślnie lokalna strefa przeglądarki, przełączalna w ustawieniach. | "czas lokalny" (dwuznaczne — lokalny kogo?) |
| Obserwowane | `Watchlist` | Wydarzenia oznaczone gwiazdką przez użytkownika; lista trzymana w localStorage przeglądarki. Narzędzie jest statyczne — brak kont. | "ulubione", "subskrypcje", "powiadomienia" (te ostatnie świadomie poza zakresem v1) |
| Eksport do kalendarza | `CalendarExport` | Dodanie pojedynczego wydarzenia do Google Calendar lub Apple Calendar (link/templates + plik ICS). Jednorazowa akcja, nie synchronizacja. | "synchronizacja kalendarza" |
| Terminarz sezonu | `SeasonSchedule` | Pełny terminarz drużyny na sezon, dostępny z nawigacji po drużynach. | "kalendarz drużyny" |
| Tydzień | `WeekView` | Domyślny zakres widoku głównego: aktualny tydzień (dzisiaj + kilka dni do przodu). Inne zakresy dat możliwe. | — |
| Status wydarzenia | `EventStatus` | `scheduled` / `live` / `finished` / `postponed` / `canceled`. Przełożenie rodzi nową instancję wydarzenia z nowym terminem. | "anulowany" dla przełożonego (to dwa różne stany) |
| Ustawienia | `UserSettings` | Konfiguracja użytkownika w localStorage: strefa czasowa + dokładnie 3 pasma z zakresami. Istnieją wartości domyślne jeszcze przed pierwszą edycją. | "profil", "konto" |
| Ulubione drużyny | `FavoriteTeam` | Lista drużyn oznaczonych przez użytkownika; wyróżnia ich mecze, daje szybki dostęp do terminarzów i zasila filtr "tylko moje drużyny". | "obserwowane drużyny" (myli się z watchlistą wydarzeń) |
| Filtr "tylko moje drużyny" | `MyTeamsFilter` | Przełącznik jednoklikowy na liście wydarzeń: pokazuj tylko mecze ulubionych drużyn. | "moje mecze" |
| Pasek filtrowania | `FilterBar` | Wspólny pasek filtrowania każdej listy: tier 1 (pasmo + sport) zawsze widoczny, ligi multi-select za przyciskiem "More filters" z licznikiem wyborów. Stan czysty na każdą wizytę, per-ekran; widok dzielony przez URL. | "panel filtrów", "ustawienia listy" |
| Tabela / pozycja drużyny | `Standing` | Pozycja drużyny w tabeli ligi; przyszłościowy miernik atrakcyjności wydarzenia. Poza v1. | "ranking" |
| Zasada pasm | — (zasada, nie encja) | Każda lista w aplikacji (tydzień, watchlista, terminarz sezonu) filtruje się po pasmach godzinowych, sporcie i lidze — wspólnym `FilterBar`. Zakres dat należy do ekranu-listy. | |
| Pipeline danych | `DataPipeline` | GitHub Action na cronie: pobiera/scrapuje terminarze lig, normalizuje i commituje statyczny JSON do repo. Zamiast backendu. | "backend", "serwer" |
| Snapshot danych | `DataSnapshot` | Plik `public/data.json` produkowany przez `DataPipeline`: katalog (sporty/ligi/drużyny) + wydarzenia + `generatedAt` + `window`. Jedyna prawda o danych realnych; przeczytany przez data-source fetchem same-origin. | "baza danych", "cache" |
| Okno danych | `DataWindow` | Zakres czasowy snapshotu. Ligi zespołowe: **pełny sezon** zawierający datę generacji (start→koniec sezonu, ADR-0019 — karmi terminarze sezonu); F1: 7 dni wstecz + 14 dni w przód (OpenF1). Pole `window` w snapshocie = unia okien lig (min from / max to) — UI używa jej do stanów beyond-window. | "cache TTL", "retencja" |
| Ligi startowe (v1) | — | NHL, NBA, NFL, F1, Premier League, Serie A, Bundesliga, La Liga — 5 sportów, 8 lig. | |

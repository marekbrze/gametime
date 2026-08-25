# Sports Calendar (nazwa robocza — do ustalenia)

## Core Idea
Publiczne, statyczne narzędzie (GitHub Pages): jeden kalendarz wydarzeń sportowych ze wszystkich śledzonych sportów i lig, wyświetlany w strefie czasowej użytkownika i dzielony na trzy konfigurowalne pasa godzinowe (dzień / wieczór / noc). Zastępuje ręczne składanie terminarów z wielu stron lig i agregatorów typu ESPN.

## User Problems

- **Terminarze rozsiane po wielu stronach**: kibic dziś sprawdza osobno strony lig i agregatory (ESPN) dla każdego sportu, a potem składa tydzień do przodu w głowie. Zjada to sporo czasu i wymaga znajomości kilku interfejsów.
- **Strefa czasowa niedopasowana do lig**: kibic żyje w Polsce, a ligi amerykańskie (NHL, NFL, NBA…) grają w nocy jego czasu. Na istniejących stronach nie widać na pierwszy rzut oka, co da się obejrzeć "po ludzku" w ciągu dnia lub wieczorem, a co wypada w środku nocy.
- **Brak planowania z wyprzedzeniem**: trudno z wyprzedzeniem wychwycić "fajny mecz" i umówić się z kolegą na wspólne oglądanie — terminarze są, ale nieogarnięte czasowo.

## Target Users

- Kibic sportów (ligi amerykańskie i inne) żyjący w strefie czasowej niedopasowanej do godzin wydarzeń — np. Polska vs NHL/NFL/NBA.
- Przegląda terminarze regularnie, horyzontem tydzień do przodu (czasem dłużej).
- Chce jednego miejsca zamiast pięciu zakładek; ceni szybki rzut oka: "co w tym tygodniu w sensownych godzinach?".
- Planuje też oglądanie społecznie — z wyprzedzeniem, z kolegą.
- Nie zakłada kont i nie konfiguruje nic przed pierwszym użyciem; narzędzie ma działać od wejścia, dane użytkownika trzymane lokalnie w przeglądarce.

## Key Actions

1. **Przegląd aktualnego tygodnia** — od razu po wejściu, bez logowania i setupu: wszystkie sporty na jednej liście, mecze nocne zwinięte lub wizualnie zdyskretowane.
2. **Filtrowanie i konfiguracja widoku** — po pasie godzinowym, sporcie (nadrzędne w hierarchii), lidze, drużynie i zakresie dat (domyślnie tydzień, inne zakresy możliwe); przełączanie strefy czasowej i zakresów godzin trzech pasm.
3. **Obserwowanie wydarzeń** — gwiazdka na wydarzeniu → lista obserwowanych, trzymana lokalnie (localStorage).
4. **Dodanie do kalendarza** — eksport wydarzenia do Google Calendar / Apple Calendar jednym kliknięciem.
5. **Terminarz drużyny** — nawigacja po drużynach: pełny terminarz sezonu ulubionej drużyny.

## Happy Path

1. Kibic otwiera stronę — bez logowania, bez konfiguracji.
2. Widzi aktualny tydzień: wszystkie wydarzenia ze śledzonych sportów w swojej strefie czasowej (domyślnie lokalna przeglądarki).
3. Wydarzenia w godzinach dnia/wieczoru są wyświetlone normalnie; nocne są zwinięte lub zdyskretowane (trzy pasa kolorystyczne).
4. W razie potrzeby filtruje po sporcie, lidze, drużynie lub pasie; może też przełączyć strefę czasową i zakresy pasm w ustawieniach.
5. Gwiazdką oznacza interesujący mecz — trafia na listę obserwowanych.
6. Wrzuca go do Google/Apple Calendar i z wyprzedzeniem umawia się z kolegą na wspólne oglądanie.

## Open Questions

- **Źródło danych**: statyczna strona na GitHub Pages nie ma backendu — terminarze muszą przychodzić z publicznych API pobieranych po stronie przeglądarki (ligowe/ESPN) lub z wygenerowanych plików statycznych. Które API, ich limity i licencje — do rozstrzygnięcia przed `proto-devsetup`.
- **Zakres v1**: komplet sportów (hokej, koszykówka, futbol amerykański, baseball, piłka nożna, motorsport: F1/NASCAR/WRC, siatkówka) od razu, czy stopniowe dołączanie? Które ligi per sport na start?
- **Nazwa aplikacji**: repo nazywa się roboczo `sports`; produktowa nazwa do ustalenia.
- **Mechanika nocnych wydarzeń**: zwiniecie sekcji nocy vs sama de-emfaza wizualna — decyzja projektowa na etapie UI (`proto-highlevelui` / `proto-detail`).
- **Zakresy dat poza tygodniem**: jakie dokładnie opcje (2 tygodnie? miesiąc?) poza widokiem pełnego sezonu drużyny.
- **Motorsport — granularity**: ✅ rozstrzygnięte (ADR-0008) — każda sesja (trening/kwalifikacje/wyścig) to osobne wydarzenie z OpenF1, wyścig wyróżniony w UI przez strukturalne `sessionType`.

# event-calendar

Wynik `proto-detail`. Moduł Core #1 — główny widok aplikacji.

## Vision

Wejście na stronę = natychmiastowa odpowiedź na dwa pytania: **co trwa teraz** i **co da się łatwo obejrzeć w tym tygodniu**. Szybka identyfikacja wydarzeń live i "watchable" jest ważniejsza niż cokolwiek innego; reszta ekranu to przegląd tygodnia z klasyfikacją pasmową (dzień/wieczór/noc), gdzie noc jest świadomie zdyskretowana. Zero setupu, zero realtime API — wszystko wyliczane z czasu startu wydarzeń i strefy użytkownika.

## User Flows

### Otwarcie i skan (happy path)
1. User otwiera `/` → redirect na `/event-calendar` (ADR-0001)
2. Widzi blok **Now** na szczycu: trwające wydarzenia (badge LIVE + "Started 1h 12m ago") oraz startujące w ≤60 min ("in 42 min")
3. Pod spodem aktualny tydzień kalendarzowy: dni z nagłówkami-podsumowaniami pasm, Today wyróżnione; **dni przeszłe zwinięte pod nagłówkiem** (chipy liczników zostają — ADR-0033), skan zaczyna się od Today
4. Skanuje sekcje Day/Evening dni, ignoruje zwinięte nocne
5. Oznacza gwiazdką interesujący mecz → trafia do Watchlisty
6. Ewentualnie ⤓ eksport pojedynczego wydarzenia do kalendarza

### Rozwinięcie dnia przeszłego (ADR-0033)
1. User chce sprawdzić wynik/wydarzenie, które już się odbyło
2. Klika **nagłówek zwiniętego dnia** (pełna szerokość, chevron jak disclosure nocy) — treść rozwija się inline
3. Chipy nagłówka wciąż pokazują podsumowanie pasm także po zwinięciu — dzień da się "przeczytać" bez rozwijania

### Rozwinięcie nocy (ADR-0032)
1. User po whole-day skanowaniu chce sprawdzić, co było/bydzie nocą
2. Klika **pełnoszerokościowy, stonowany przycisk w tincie pasa Night** (delikatna obwódka, neutralny tekst, czerwone zostają tint i ikona księżyca — iteracja 2 po feedbacku "wybija się zbyt mocno") na końcu dnia: "Night — N events after midnight", pill "Show"/"Hide" + chevron
3. Sekcja rozwija się inline; wiersze nocy mają czerwoną kropkę i czas w kolorze pasa
4. Gdy noc jest jedynym pasmem dnia (albo filtr `?band=night` przefiltrował resztę) — sekcja rozwija się SAMA z mini-nagłówkiem "Night", nic nie ginie za zwinięciem

### Pager tygodnia
1. User chce planować z wyprzedzeniem → klika **Next week** (ewent. wielokrotnie)
2. Lista przewija się na kolejny tydzień kalendarzowy; nagłówek pokazuje zakres dat
3. **This week** wraca do bieżącego tygodnia; przewinięcie wstecz pokazuje przeszłość (statusy finished)

### Zmiana widoku (eksperyment)
1. User przełącza **list ↔ cards** (toggle w pasku widoku)
2. Preferencja zapisuje się w `UserSettings.viewMode`; przy next wejściu pamięta wybór

### Szczegóły wydarzenia (ADR-0035)
1. User klika **etykietę uczestników** w dowolnym wierszu/karcie (tydzień, także blok Now) → `EventDetailsDialog`
2. Dialog: pełna data/godzina, pasmo, status, **liga i uczestnicy jako linki** (liga → ekran ligi, uczestnik → terminarz — ADR-0022), eksporty Google/ICS, „Show in calendar"
3. Wydarzenie przełożone z nową instancją w danych → box „Rescheduled → nowy termin" + **Watch new date** (migracja gwiazdki, ADR-0018)

## Screens (rough)

- **Week list** (główny): blok Now → pager tygodnia → sekwencja dni. Dzień = nagłówek (dzień tygodnia + data / "Today", chipsy pasm z licznikami, kolory sygnalizacji świetlnej ADR-0032; przy meczach ulubionych dodatkowo papayowy chip licznik "N my teams" z serduszkiem, ADR-0034) → mini-sekcje "Day" i "Evening" → zwinięty disclosure Night na końcu (rozwija się sam, gdy jest jedynym pasmem dnia). **Dzień przeszły zwinięty pod nagłówkiem-przyciskiem** (ADR-0033). Wiersz: kropka pasma, emoji sportu, godzina w kolorze pasma, uczestnicy ("A vs B"; motorsport: seria + nazwa GP — etykieta klikalna, otwiera `EventDetailsDialog`, ADR-0035), badge ligi (**klikalny** → ekran ligi, `LeagueLink`, ADR-0035), ☆, ⤓; na <sm etykieta uczestników zawija się do pełnych nazw drużyn (2–3 linie, ADR-0033). Ulubione drużyny: serduszko ♥ (wypełnione, `text-brand-text`) wiodące przed uczestnikami — działa też na tintach pasm i w sekcji nocy; SR czyta "My team" (ADR-0034).
- **Cards view** (alternatywny, eksperyment): te same dane, wydarzenie jako karta (większy format, mocniej kolor pasa) — dla użytkowników wolących "kanban" tygodnia; etykieta uczestników i liga klikalne jak w wierszu.
- **Blok Now** (element, nie osobny ekran): trwające + starting soon w jednym zintegrowanym bloku; etykieta uczestników otwiera szczegóły, liga linkuje do ekranu ligi (ADR-0035).
- **EventDetailsDialog** (element współdzielony — własność modułu od ADR-0035): natywny `<dialog>` z pełną data/godziną, pasmem, statusem, linkami liga/uczestnicy, eksportami i „Show in calendar"; box „Rescheduled" z migracją gwiazdki (ADR-0018). Otwierany z każdej listy meczów (kalendarz, terminarz drużyny, watchlista).

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| View Now block | Trwające (LIVE, elapsed) + starting soon (≤60 min, countdown) | `Event` | Statusy wyliczane z czasu startu — ADR-0005 |
| Browse week list | Aktualny tydzień kalendarzowy, wszystkie sporty | `Event` | Domyślny widok |
| Page weeks | ‹ Previous / Next week › + This week; ruchome po tygodniach kalendarzowych | — | ADR-0006 |
| Expand/collapse night section | Per dzień; widoczny przycisk-tint z liczbą "events after midnight", Show/Hide + chevron | `Event` | Noc należy do wieczoru poprzedniego — ADR-0004; auto-open gdy noc jedynym pasmem — ADR-0032 |
| Expand/collapse past day | Nagłówek dnia przeszłego = przycisk (chevron, aria-expanded); chipsy liczników zostają w nagłówku | `Event` | Domyślnie zwinięte — ADR-0033 |
| Toggle view type | list ↔ cards; persystencja w `UserSettings.viewMode` | `UserSettings` | Eksperyment adopcji — ADR-0006 |
| Star / Unstar event | Gwiazdka z wiersza | `WatchlistEntry` | |
| Open event details | Klik w etykietę uczestników (wiersz/karta/Now) → `EventDetailsDialog`; liga w dialogu i w wierszu → ekran ligi | `Event`, `League` | ADR-0035; „Watch new date" migruje gwiazdkę (ADR-0018) |
| Export single → calendar | Google (link) / Apple (ICS) z wiersza | `Event` | Moduł calendar-export |
| See event status | scheduled / live / finished / postponed / canceled | `Event` | Pasywne, data-driven |
| Filter list | Pasmo + sport + ligi (More filters) + MyTeamsFilter (FilterBar modułu filters) | — | Zasada uniwersalna; ADR-0012 |

## Edge Cases

- **Brak realtime**: statusy live/finished wyliczane z czasu startu + szacowanego czasu trwania **per sport** (soccer 2.5h, NHL/NBA 2.75h, NFL 3.5h; F1 per sessionType — race 2h, pozostałe 1.5h). Przekładania/odwołania widoczne dopiero po przebiegu pipeline'u — lag akceptowany.
- **Ładowanie i błąd fetchu**: skeleton odzwierciedlający strukturę tygodnia → error card z Try again (`refresh()` bez reloadu strony); copy uwzględnia brak połączenia.
- **Awaria zapisu localStorage** (private mode, quota): zapis przed zmianą stanu UI (wizualny rollback) + zamykalny banner StorageWarning — jedyna droga utraty danych usera nie jest cicha.
- **Pusty tydzień**: trzy warianty — filtry (CTA Clear filters), faktycznie pusty tydzień (hint off-season), tydzień **poza oknem danych** ("No data for this week" + zakres DataWindow + Back to this week).
- **Off-season w filtrach**: sporty bez wydarzeń w całym oknie danych dostają w selectie suffix " — no events" (opcja nieblokująca).
- **Przełożone vs anulowane** (ADR-0011): `postponed` **zostaje na liście** w starym terminie — przygaszony z adnotacją, user planujący oglądanie widzi, że mecz odpada; `canceled` znika (domykanie z feedu — ENTITY_MAP).
- **Świeżość danych**: stopka "Data as of {data, godzina}" z `generatedAt` snapshota (pipeline odświeża raz dziennie).
- **Zmiana strefy czasowej / zakresów pasm**: przelicza bucketowanie pasm i nocną grupę — czysta recomputacja, bez przeładowania danych.
- **Wydarzenie przekracza granicę pasa** (np. start 21:45, trwa do 00:30): pasmo klasyfikujemy po **czasie startu**.
- **Dziś po północy**: "Today" zaczyna się od bieżącej pory — wciąż działa, bo noc (0:00–6:00) należy do wczorajszego wieczoru; blok Now niezależny od dnia.
- **Tydzień przeszły po przewinięciu wstecz**: wszystkie dni zwinięte (reguła `isPast` nie zna wyjątków, ADR-0033) — chipsy nagłówków dają przegląd wyników, szczegóły po rozwinięciu dnia.
- **Zawijanie etykiet na mobile**: <sm wiersz rośnie w głąb (pełne nazwy drużyn, 2–3 linie), ≥sm wraca gęstość jednowierszowa z truncate (ADR-0033).

## Integration Points

- **filters**: wspólny FilterBar nad listą (pasmo/sport/liga/MyTeamsFilter) — zasada uniwersalna; stan widoku (tydzień + filtry) w URL — ADR-0014
- **watchlist**: gwiazdka w wierszu; obserwowane nie są tu specjalnie traktowane (ich dom to moduł watchlist); `EventDetailsDialog` — własność event-calendar od ADR-0035, watchlist konsumuje
- **calendar-export**: ⤓ w wierszu; akcje w `EventDetailsDialog`
- **teams**: podświetlenie ulubionych drużyn w wierszach; link z uczestnika → SeasonSchedule; liga (`LeagueLink`) → ekran ligi; terminarz drużyny otwiera ten sam dialog szczegółów
- **settings**: strefa czasowa + zakresy pasm napędzają całą klasyfikację; `viewMode` stąd
- **data-source**: jedyny dostawca danych; kontrakt: Event ze stabilnym `startUtc`

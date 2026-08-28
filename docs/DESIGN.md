# Design Direction

Wynik `proto-brand`. Kierunek wizualny obowiązuje `proto-design` (wdrożenie) i `proto-polish` (finalny pass). Zmiana kierunku = edycja tego pliku lub ponowny `proto-brand`, nie lokalne odstępstwa w kodzie.

## Register

**product** — narzędzie zadaniowe („co dziś/jutro obejrzę po ludzku?”); bar: earned familiarity. Design znika w zadaniu.

## Scene

Kibic sprawdza terminarz **o dowolnej porze i w pełnym spektrum światła** — znudzony w biurowym dniu przy jasnym ekranie i wieczorem u kumpla na kanapie w półmroku — i w obu scenach chce odpowiedzi „co jest teraz” w jednym rzucie oka.

**Wniosek wymuszony przez scenę:** dwie równoprawne tematy — light i dark — obie first-class, domyślnie podążające za `prefers-color-scheme`. Żadna nie jest „prawdziwa”, druga „dodatkiem”. Drugi wniosek: **NowBlock i wiersz wydarzenia muszą się czytać w pół sekundy** — to mierzy cała hierarchia.

## Personality

**żwawe, zwarte, pewne siebie** — klimat tablicy wyników (scoreboard), ale stonowany: gęsta informacja bez ścisku, pewna hierarchia bez krzyku, odpowiedź w jednym rzucie oka.

## References

- **Apple Sports**: czystość score-appingu — duże czytelne wartości, kolor niesie identyfikację (u nas: pasma), reszta znika; zero ornamentu.
- **FotMob**: wiersz meczu czytany w pół sekundy — czas, uczestnicy, status w jednej linii rytmu; gęstość bez ścisku. Najbliższy wzorzec dla naszego wiersza `SportEvent`.

## Anti-references

- **ESPN (portal)**: wszystko konkuruje o uwagę — bannery, puszki, krzykliwe akcenty; użytkownik zagłuszony zanim znajdzie terminarz.
- **Flashscore / serwisy bukmacherskie**: ściana liczb bez hierarchii, agresywna gęstość, tryb alarmowy wszędzie.
- **Esportowe overlaye**: neon na ciemnym tle, glow, gradientowe karty — „sport = krzyk” w najgorszym wydaniu.

## Color

**Strategy**: **Restrained + paleta pasm** — tintowane neutralse + jeden akcent brandowy ≤10% powierzchni (akcje, linki, gwiazdka, fokus); trzy hue pasm to **funkcyjne role danych** (jak kolory kategorii w dataviz), zarezerwowane wyłącznie dla klasyfikacji TimeBand i nigdy jako dekoracja.

**Seed hue**: **papaya orange** — oklch(0.72 0.17 48) — wybór designera („orange, lubię go bardzo”); sprecyzowany do motorsportowej papai (McLaren): wyrazisty, pewny siebie, hue 45–50 wyraźnie odcięty od czerwieni statusów. Odrzuca odruchy AI (blue ~250 / warm orange ~60 to hue sąsiednie, ale papaya 48 z chromą 0.17 i czarnym tuszem na przyciskach to inny obiekt fizyczny: tablica wyników, nie gradientowy landing).

**Parowanie tuszu z papają (zamiast bieli):** tekst/ikony na akcencie = ciemny tusz oklch(0.20 0.02 48), nie biały — biel na L 0.72 daje ~2:1 (fail); tusz daje ~6:1 i brzmi „scoreboard”. To sygnatura systemu.

### Brand (papaya, hue 48)

| Role | Token | Value | Notes |
|------|-------|-------|-------|
| Brand/300 | --brand-300 | oklch(0.82 0.12 52) | akcenty-tekst na dark |
| Brand/400 | --brand-400 | oklch(0.77 0.15 50) | marki dekoracyjne dark, hover tintów |
| Brand/500 | --brand-500 | oklch(0.72 0.17 48) | **papaya**: primary bg, kropki, gwiazdka, selekcja |
| Brand/600 | --brand-600 | oklch(0.64 0.16 47) | hover primary, focus ring (light) |
| Brand/700 | --brand-700 | oklch(0.55 0.14 45) | ikony/duży tekst akcentowy na light (≥3:1) |
| Brand/800 | --brand-800 | oklch(0.47 0.12 44) | link-tekst na light (≈4.8:1) |
| Primary fg | --primary-foreground | oklch(0.20 0.02 48) | tusz na papai — NIGDY biel |

### Neutrals — tint chromą 0.003–0.012 ku hue 48 (brand-warm, NIE default-cream hue 60)

| Role | Token (light) | Value | Dark | Value |
|------|------|-------|------|-------|
| Canvas | --background | oklch(0.975 0.005 48) | --background | oklch(0.15 0.008 48) |
| Surface (card) | --card | oklch(0.99 0.003 48) | --card | oklch(0.19 0.009 48) |
| Raised (popover, menu) | — | oklch(1 0 0) | — | oklch(0.23 0.010 48) |
| Fill subtle (hover, chip bg) | --secondary/--accent | oklch(0.945 0.007 48) | — | oklch(0.26 0.010 48) |
| Border | --border | oklch(0.885 0.008 48) | — | oklch(0.30 0.010 48) |
| Border strong | — | oklch(0.80 0.010 48) | — | oklch(0.36 0.010 48) |
| Text body | --foreground | oklch(0.21 0.011 48) | — | oklch(0.955 0.006 48) |
| Text muted | --muted-foreground | oklch(0.46 0.012 48) | — | oklch(0.70 0.011 48) |
| Text heading | — | oklch(0.155 0.010 48) | — | oklch(0.985 0.004 48) |

Głębia na dark pochodzi z **jasności surfaców** (0.15 → 0.19 → 0.23), nie z cieni. Akcenty na dark lekkę zdesaturowane (chroma −0.02); body weight bez zmian (Geist ma czytelne 400 na dark).

### Time bands — hue rozłączne z papają i z semantyką (przemapowane z lo-fi sky/amber/violet!)

| Band | Hue | Base (dot/mark) | Tint bg (light) | Text on tint (light) | Fill (dark) | Text (dark) |
|------|-----|-------|------|------|------|------|
| day | azure 225 | oklch(0.58 0.10 225) | oklch(0.93 0.03 225) | oklch(0.42 0.08 225) | oklch(0.26 0.045 225) | oklch(0.80 0.08 225) |
| evening | sunset magenta 335 | oklch(0.66 0.14 335) | oklch(0.94 0.03 335) | oklch(0.45 0.11 335) | oklch(0.27 0.05 335) | oklch(0.82 0.08 335) |
| night | indigo 275 | oklch(0.54 0.12 275) | oklch(0.93 0.03 275) | oklch(0.44 0.10 275) | oklch(0.25 0.05 275) | oklch(0.78 0.08 275) |

Dlaczego przemapowanie: lo-fi amber wieczoru kolidowałby z papają akcentu (hue 75 vs 48 — too close na kropce 8px). Nowe kotwice semantyczne: **azure = dzienne niebo, magenta = ostatni żar zachodu, indigo = noc**. Min. odstęp hue w zbiorze {papaya 48, azure 225, magenta 335, indigo 275} ≈ 40°. Kolor pasma **nigdy nie jest jedynym nośnikiem** — zawsze etykieta + pozycja w cyklu + grupowanie.

### Semantic

| Role | Light | Dark | Notes |
|------|-------|------|-------|
| success | oklch(0.55 0.12 150) | oklch(0.75 0.11 150) | potwierdzenia, saved |
| destructive | oklch(0.55 0.19 27) | oklch(0.68 0.17 27) | usuwanie, błędy — tylko akcje destrukcyjne |
| live | oklch(0.58 0.20 25) | oklch(0.68 0.18 25) | chip LIVE + puls; dzieli rodzinę z destructive (konwencja sportowa), rozróżniane kontekstem i kształtem |
| warning | oklch(0.65 0.12 80) | oklch(0.78 0.11 80) | oszczędnie: postponed |

**Radius**: jeden --radius: 0.5rem (zwarte), warianty wyliczane jak dotąd (sm/xl/2xl); pill (999px) tylko kropki pasm i chipy statusów. **Focus ring**: 2px, offset 2px, brand-600 (light) / brand-400 (dark).

## Typography

**Direction**: jeden dobrze nastrojony sans — product register, zero pary display+body.
**Family**: **Geist Variable** (już self-hosted przez `@fontsource-variable/geist` — zero network cost, font-display inherent). Kompaktowy x-height i technicalna pasta = dokładnie „żwawe, zwarte, pewne siebie”; odrzuca odruch „Inter wszędzie”. Fallback: `system-ui, sans-serif` (metrycznie bliski x-height).

**Scale** (fixed rem, ratio ~1.15):

| Step | rem | Użycie |
|------|-----|--------|
| xs | 0.75 | meta, overline, legal |
| sm | 0.8125 | etykiety chipów, secondary |
| **base** | 0.875 | body, wiersz wydarzenia (zwarte) |
| md | 1 | nagłówki sekcji, kontrolki |
| lg | 1.125 | tytuł ekranu |
| xl | 1.375 | liczbę NowBlock |
| 2xl | 1.75 | display: countdown, pusta lista |

**Weights**: 400 (body), 500 (kontrolki/labels), 600 (headings, wyróżnienia) — trzy role, nic więcej.
**Loading**: już self-hosted variable; fallback `font-display` przez fontsource (swap). Preload niepotrzebny (same-origin, bundlowane).
**Details**: `font-feature-settings: 'tnum' 1` (tabular-nums) na WSZYSTKICH czasach, licznikach i godzinach — to aplikacja godzin; line-height 1.45 body / 1.2 headings / 1.1 display; measure n/d (prose brak w v1).

## Motion

**Funkcyjny, 150–220 ms, ease-out; jeden sygnaturowy moment: puls kropki LIVE.**

- 150 ms: hover, focus, aktywacja
- 200 ms: expand/collapse (sekcja nocy, dd listy), chipy
- 250 ms max: dialogi/sheety (istniejący idiom shadcn)
- **Puls LIVE**: 2 s loop, opacity 1→0.5→1 na kropce, zero scale (subtelnie); wyłączony pod `prefers-reduced-motion`
- `prefers-reduced-motion`: wszystkie przejścia → none; treść stanów niezależna od animacji

## Guardrails

**Absolute bans** (match-and-refuse):
- Side-stripe bordery (`border-l/r > 1px` jako kolorowy akcent) — **w tym istniejące lo-fi `BAND_EDGE` (`border-l-sky/amber/violet`)**; zamiennik: kropka wiodąca + tint tła
- Gradient text (`background-clip: text`); wyróżnienie = weight/size, nie gradient
- Glassmorphism jako default
- Hero-metric template, identyczne siatki kart, tiny uppercase tracked eyebrow nad każdą sekcją, `01/02/03` jako default scaffolding
- Tekst przepełniający kontener na dowolnym breakpoint (tekst uczestników: truncate z title, wbudowany wrap zespołów)

**Product bans**:
- Dekoracyjny motion poza stanami (jedyny wyjątek: puls LIVE)
- Niespójne słownictwo komponentów między ekranami (te same wiersze/chipy/kropki wszędzie)
- Display font w labelach/przyciskach/danych
- Wynajdowanie standardowych afordancji (custom scrollbary, dziwne form controls)
- Ciężkie akcenty na stanach nieaktywnych
- Modal-first (najpierw inline, dialog tylko na potwierdzenie resetu — istniejący idiom)

**Contrast floor**: body ≥4.5:1, duży tekst/UI ≥3:1, **placeholder 4.5:1** (muted-foreground dobrany pod to: oklch 0.46 na canvas 0.975 ≈ 4.6:1). Muted body na tintowanej bieli to najczęstszy fail — sprawdzać na tintach pasm.

## Hand-off to proto-design

- **Mechanika tokenów**: Tailwind v4 — OKLCH custom properties w `:root`/`.dark` + mapowanie w `@theme inline` (istniejący schemat shadcn); tokeny pasm jako `--band-day/evening/night-*` w obu tematach; sidebar/chart tokeny: mapować na nowe neutralse (nieużywane, ale spójne)
- **Theme switching**: dark klasy nie przełącza nic — dodać system-following (matchMedia `prefers-color-scheme` → klasa `.dark` na `html`; istniejący `use-media-query` do wykorzystania); bez ręcznego toggle'a w v1 (scena: „dowolny czas” = system wie lepiej)
- **Najwyższa dźwignia pierwszy krok**: wymiana neutralnej bazy (czysta szarość chroma 0) na tintowane neutralse + papaya w `:root`/`.dark` — od razu zmienia całą appkę
- **Kolejność modułów** (z MODULES.md): event-calendar (to jest produkt; wiersz + NowBlock + pasma) → filters (drugi design-wrażliwy) → AppShell (header/tabs/footer na nowych tokenach) → watchlist → teams → settings (BandsPreview dostaje nowe hue pasm; usunąć etykiety-segmenty już są usunięte) → calendar-export (akcje wiersza współdzielone)
- **Lo-fi do rozmontowania**: `BAND_EDGE` (side-stripe ban), `BAND_CHIP/BAND_DOT` palety Tailwinda → tokeny pasm z DESIGN.md; ad-hoc `text-white` na pasmach (już zwieńczone w ADR-0028)
- Geist zostaje — tylko spójna skala i tnum w danych

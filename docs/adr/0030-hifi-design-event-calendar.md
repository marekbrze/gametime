# 0030 - Hi-fi design applied: token layer + event-calendar

**Date**: 2026-08-28
**Module**: event-calendar (+ warstwa tokenów project-wide, słownictwo współdzielone); pass 2 domyka pozostałe moduły
**Status**: Accepted

## Context

Wszystkie moduły były neutralnym lo-fi (shadcn defaults, czysta szarość chroma 0, ad-hoc kolory pasm sky/amber/violet na side-stripe'ach). `docs/DESIGN.md` (ADR-0029) zdefiniował kierunek: papaya oklch(0.72 0.17 48), neutralse tintowane ku hue 48, pasma azure/magenta/indigo, Geist, dark równoprawny system-following.

## Decision

Wdrożono DESIGN.md przez mechanizm Tailwind v4 + shadcn (`:root`/`.dark` OKLCH → `@theme inline`):

- **Tokeny (project-wide)**: pełna paleta z DESIGN.md — papaya + tusz jako primary-foreground (NIE biel), 11-stopniowe neutralse tintowane (chroma 0.003–0.012, hue 48), tokeny pasm `--band-{day,evening,night}[-tint|-text]` w obu tematach, `--live`/`--live-text` (konwencja sportowa, AA na tintach), `--warning`/`--warning-text`, `--brand-text` (AA-kompatybilny tekst brandowy — wariant `link` buttona poprawiony z `text-primary` ≈1.9:1 na AA), radius 0.5rem (zwarte), ring = brand
- **Dark mode**: mechanika `.dark` na html przez `matchMedia('prefers-color-scheme')` w main.tsx (system-following, bez toggle'a — scena z DESIGN.md); `color-scheme` per temat; dark: głębia z jasności surfaców 0.15/0.19/0.23, doty pasm rozjaśnione i zdesaturowane
- **Typografia**: Geist zostaje (self-hosted); semantyczne tokeny skali `--text-caption/label/hero/display` (12/13/22/28) obok nietkniętych defaultów shadcn; `font-variant-numeric: tabular-nums` globalnie na body (aplikacja godzin)
- **Motion**: `--animate-live-pulse` (2 s, opacity-only) jako JEDYNY sygnaturowy moment; wyłączony pod `prefers-reduced-motion`; stany 150 ms
- **event-calendar**: side-stripe'y usunięte (ban absolutny) — wiersz prowadzi kropka pasma `BAND_DOT`, kartę niesie tint `BAND_CARD`; gwiazdka papaya (akcja brandowa); NowBlock = signature surface (papayowy wash `bg-primary/8`, border-primary/25), chip SOON papaya, LIVE na tokenach live; StorageWarning na warning; szkielety odbijają nowy kształt wiersza
- **Słownictwo współdzielone**: `bands-ui.ts` przemapowany na tokeny (BAND_EDGE usunięty — konsumenci: EventRow/EventCard automatycznie, FilterBar/EventDetailsDialog przez BAND_CHIP); gwiazdki ulubionych drużyn (teams ×3) ujednolicone do papai; EventDetailsDialog amber → warning

## Impact

- Ekran kalendarza hi-fi i on-brand; wszystkie pozostałe ekrany (watchlist/teams/settings) odziedziczyły tokeny automatycznie (zweryfikowane zrzutami light+dark) — ich dedykowane passy będą głównie doszlifowaniem słownictwa
- Weryfikacja: build ✅, skrypt playwright 15/15 (tokeny w DOM 1:1: canvas `oklch(0.975 0.005 48)`, gwiazdka `oklch(0.72 0.17 48)`, kropka `oklch(0.58 0.1 225)`, border-l 1px, dark system-following, deep-link `?w=1`, pager łańcuchuje, night toggle)
- **Odkryty istniejący bug (poza zakresem designu, potwierdzony na bundlu sprzed zmian)**: pierwsza nawigacja `setSearchParams` po załadowaniu strony aktualizuje hash bez re-renderu (kolejne nadganiają stan) — routing do `proto-bug`
- Znalezione podczas przeglądu, przekazane `proto-polish`: gwiazda papaya na jasnej karcie ≈1.9:1 jako wskaźnik stanu (floor 3:1 dla UI) — rozważyć papayowe tło pod gwiazdką lub ciemniejszy fill
- Projekt storybook-vitest (`vitest run --project storybook`) pada w tym środowisku na imporcie setupu (aria-query/elementRoles) — niezależnie od zmian (weryfikacja na czystym drzewie); weryfikacja E2E szła skryptem playwright wg konwencji z memory

## Pass 2 — pozostałe moduły (ten sam dzień)

Tokeny i współdzielony DayGroup/EwentRow/BAND_CHIP przeniosły design na watchlistę, terminarz drużyny i ustawienia automatycznie (zweryfikowane zrzutami + kliknięciem drill-down teams → schedule). Dedykowane zmiany:

- **AppShell**: sygnatura brandowa w logo — „gametime**.**" z papayową kropką (tablica wyników); nawigacja/stopka/taby mobilne na tokenach bez zmian strukturalnych (restrained)
- **calendar-export**: dropdown ExportMenu `bg-background` → `bg-popover` (uniesiona powierzchnia — poprawna głębia w dark: 0.23 vs 0.15)
- **filters**: wiersz pasm FilterBar — aktywny chip pasma niesie tint+tekst pasma (BAND_CHIP przez twMerge nadpisuje wariant default); „Any time"/aktywne filtry niepasmowe = papaya (akcent = bieżący wybór)
- **settings**: BandsPreview odziedziczył nowe hue pasm bez zmian kodu (tokeny), screen na tokenach

Regresja playwright 5/5: kropka logo w DOM papaya, popover oklch(1 0 0), drill-down teams → terminarz (DayGroup), settings dark system-following.

# 0029 - Visual direction captured

**Date**: 2026-08-28
**Status**: Accepted

## Context

Prototyp po `proto-harden` na wszystkich modułach był neutralnym lo-fi: shadcn defaults (czysta szarość, chroma 0), ad-hoc kolory pasm z palety Tailwinda (sky/amber/violet na side-stripe'ach), Geist z szablonu bez spójnej skali. Przed hi-fi potrzebny był pisany kierunek wizualny — bez niego każda decyzja kolorystyczna byłaby re-litigowana per ekran.

## Decision

`proto-brand` przejął kierunek do `docs/DESIGN.md` (wywiad 7 decyzji z designerem):

- **Register**: product (narzędzie zadaniowe; bar: earned familiarity)
- **Scena**: użycie w pełnym spektrum światła (biurowy dzień ↔ wieczór u kumpla) → **light i dark równoprawne, system-following** (`prefers-color-scheme`); brak ręcznego toggle'a w v1
- **Osobowość**: żwawe, zwarte, pewne siebie — stonowany scoreboard
- **Referencje**: Apple Sports (czystość), FotMob (glanceable row); anty: ESPN, Flashscore, esportowe neony
- **Kolor**: Restrained + paleta pasm; **seed hue = papaya orange oklch(0.72 0.17 48)** (wybór designera, sprecyzowany do papai McLarenowskiej); tusz zamiast bieli na akcencie (kontrast ~6:1 vs ~2:1); neutralse tintowane ku hue 48 (chroma 0.003–0.012); **pasma przemapowane: day→azure 225, evening→sunset magenta 335, night→indigo 275** — bo lo-fi amber kolidowałby z pomarańczą akcentu, a side-stripe bordery (`BAND_EDGE`) wchodzą na listę banów absolutnych (zamiennik: kropka wiodąca + tint)
- **Typografia**: Geist Variable zostaje (self-hosted, zero kosztu); skala fixed rem 12/13/14b/16/18/22/28 (ratio ~1.15), wagi 400/500/600, tabular-nums na wszystkich czasach
- **Motion**: funkcyjny 150–220 ms + jedyny sygnaturowy moment: 2 s puls kropki LIVE (off pod reduced-motion)

## Impact

- `proto-design` wdraża DESIGN.md per moduł (kolejność: event-calendar → filters → AppShell → watchlist → teams → settings → calendar-export); pierwszy krok: wymiana tokenów `:root`/`.dark` + mechanika `.dark` (dziś nieprzełączana)
- `proto-polish` domyka kontrast/stany/detale po designie
- Zmiana kierunku = edycja DESIGN.md lub ponowny `proto-brand`; ban side-stripe'ów oznacza rozmontowanie `BAND_EDGE` z lo-fi (świadomie, jako decyzja systemowa — nie regres)

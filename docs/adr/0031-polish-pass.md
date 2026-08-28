# 0031 - Polish pass (cała apka po proto-design)

**Date**: 2026-08-28
**Module**: wszystkie (jeden wspólny słownik komponentów; matryca kontrastu per token, nie per ekran)
**Status**: Accepted

## Context

Po wdrożeniu DESIGN.md (ADR-0030) powierzchnia była hi-fi, ale bez finalnego passu: kontrast liczony na oko, część linków bez focus-visible, brak h1 na kalendarzu, drobne niespójności copy/kapitalizacji, cele dotykowe 32px.

## Decision

**Kontrast — pomiar, nie szacunek**: autorski audyt token-matrix w chromium (parsowanie OKLCH/oklab z computed styles, kompozyting alpha w linear sRGB, WCAG ratio; light + dark; 27 par tokenów). Wynik: 2 realne fale z ~27 par:

1. **Gwiazdka watched `text-primary` na karcie (light) = 2.55:1** (UI floor 3:1) → `text-brand-text` (6.98:1 light / 10.26:1 dark; nadal czytelnie papaya) — dotyczy EventRow, EventCard i trzech ekranów teams
2. **Chip LIVE w dark: live-text 0.72 na live/12 = 4.37:1** → `--live-text` dark podbity do oklch(0.76 0.15 25) ✓

Wszystkie pozostałe pary (tinty pasm × teksty, SOON na podwójnym papayowym washu, muted na washu, tusz na papayi 6.91:1, kropki pasm 3.24–5.05:1) — PASS. Matryca audytu usunięta po pass (tmp script), pary i wyniki udokumentowane tutaj.

**Stany interakcji**: focus-visible (ring brand, outline-2 + offset) dodany do: NavLink desktop, taby mobilne, logo, itemy ExportMenu (tamże outline-none → bg-muted jak hover), inline link „Back to this week". Hit-area 44px na gwiazdce i triggerze eksportu (`after:-inset-1.5` — visual 32px, dotyk 44px, bez rozbicia rytmu wiersza).

**Typografia/hierarchia**: h1 per ekran — Calendar dostaje sr-only h1 (reszta miała); rozmiar h1 ujednolicony text-xl (Settings był 2xl). Kapitalizacja nazw pasm ujednolicona: „Day/Evening/Night" wielką literą w FilterBar i chipach DayGroup (wcześniej lowercase przy „Any time" wielką — niespójność).

**Motion**: `prefers-reduced-motion` gași też `animate-pulse` (szkielety loadingu), nie tylko sygnaturowy puls LIVE.

**Responsywność** (zmierzono 375px): zero poziomego scrolla, 4 taby, cele dotykowe ✓.

## Impact

- Aplikacja przechodzi pełną matrycę kontrastu AA w obu tematach; klawiatura dostaje brandowe ringi wszędzie; hierarchia nagłówków i copy spójne
- Jakość: flagship na wymiarach mierzalnych (kontrast/stany/a11y/responsywność)
- **Odroczone (świadomie)**: chipy 12px na mobile (labels, nie body — odchylenie od reguły „<14px"; standard rynkowy), bug pierwszej nawigacji setSearchParams (routing → proto-bug, ADR-0030)
- Weryfikacja: build ✅, eslint ✅, regresja playwright 7/7 (h1, star brand-text w DOM, kapitalizacja, focus-visible, dialog, dark) + zrzuty finalne light/dark/mobile

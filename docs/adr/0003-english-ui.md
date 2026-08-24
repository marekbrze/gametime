# 0003 — UI w języku angielskim

**Date**: 2026-08-24
**Module**: app-shell (dotyczy wszystkich modułów)
**Status**: Accepted (supersuje fragment ADR-0001: "UI po polsku")

## Context
ADR-0001 ustalił polskie etykiety nawigacji (Kalendarz, Obserwowane, Drużyny, Ustawienia). Projekt ewoluował w kierunku publicznego narzędzia dla szerokiego grona kibiców w niedopasowanych strefach czasowych — nie tylko polskich. Owner zadecydował, że aplikacja ma być w pełni po angielsku.

## Decision
Cały interfejs użytkownika (etykiety, aria-labels, komunikaty, footer, placeholdery) po angielsku. Etykiety nawigacji = Code Names z GLOSSARY.md: Calendar, Watchlist, Teams, Settings. `<html lang="en">` (już był). Dokumentacja projektowa (docs/) pozostaje po polsku — to warstwa warsztatowa ownera, nie produkt.

## Impact
Wszystkie przyszłe ekrany z `proto-lofi` / `proto-design` / `proto-polish` piszą copy po angielsku. GLOSSARY.md zostaje mapowaniem PL → EN (kolumna Code Name jest teraz jednocześnie etykietą UI). Daty/godziny: format zona-dependent (Intl API wg strefy użytkownika), nie hardcodowany en-US.

# [0025] - settings: pasma edytowane dwiema granicami, noc przypięta do północy

**Date**: 2026-08-27
**Module**: settings
**Status**: Accepted

## Context

Podczas proto-detail(settings) trzeba było rozstrzygnąć, jak user edytuje zakresy trzech TimeBandów. Istniejący kod (`bandOfMinutes`, `viewingDayKeyInZone`, filtry) zakłada niepisany kontrakt: pasma pokrywają całą dobę, a noc zaczyna się o północy. Rozważane modele: (a) dwie granice z nocą przypiętą do północy, (b) trzy granice w pierścieniu z nocą zawijaną przez północ, (c) niezależne zakresy per pasmo z możliwymi lukami/nakładkami.

## Decision

Model (a): user ustawia wyłącznie **Day starts** (default 6:00) i **Evening starts** (default 22:00), krok 30 min z wzajemnym clampem (0:30 ≤ day < evening ≤ 23:30). Noc = północ→dzień, Wieczór = evening→północ. Reprezentacja w storage (`start`/`end` per pasmo w minutach) bez zmian; konsumenci bez zmian.

## Impact

- GLOSSARY (Dzień/Wieczór/Noc), ENTITY_MAP (TIME_BAND), ACTIONS (Edit band ranges) zaktualizowane o model dwugraniczny.
- Brak luk/nakładek w konfiguracji z definicji — upraszcza przyszły audyt edgecases (nie ma stanu "pasma nie pokrywają doby").
- Ograniczenie świadome: user nie przesunie początku nocy poza północ (np. noc 1:00–7:00) — zawijanie przez północ wymagałoby zmiany reprezentacji i logiki ViewingDay; poza realnym przypadkiem głównym (kibic w PL vs ligi US).
- Ekran ustawień pokazuje konsekwencję granicy nocy: wydarzenia 0:00–Day starts należą do wieczoru dnia poprzedniego (ADR-0004).

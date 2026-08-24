# 0004 — Noc należy do wieczoru poprzedniego (ViewingDay)

**Date**: 2026-08-24
**Module**: event-calendar
**Status**: Accepted

## Context
Podczas detailingu event-calendar rozstrzygaliśmy otwarte pytanie z PROJECT.md o mechanikę nocnych wydarzeń. Mecz o 01:30 w środę (noc wtorkowo-środowa) mógłby kalendarzowo leżeć na górze środy.

## Decision
Grupujemy po **dniu widokowym (ViewingDay)**, nie kalendarzowym: wydarzenia z pasa Night (0:00–6:00) prezentują się jako zwinięta sekcja "after midnight" **na końcu wieczoru dnia poprzedniego**. Rationale: tak myśli widz — "we wtorek wieczorem umawiamy się na mecz o 1:30 w nocy". Zaktualizowano GLOSSARY (ViewingDay) i ENTITY_MAP (TimeBand).

## Impact
Wszystkie listy (tydzień, watchlista, terminarz sezonu — zasada uniwersalna) grupują noc po wieczorze poprzednim. Data layer musi dostarczać `startUtc`; bucketowanie po ViewingDay liczy warstwa prezentacji w strefie użytkownika.

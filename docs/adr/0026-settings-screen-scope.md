# [0026] - settings: zakres ekranu ustawień (IANA select, reset z dialogiem, bez viewMode)

**Date**: 2026-08-27
**Module**: settings
**Status**: Accepted

## Context

Proto-detail(settings) — trzy decyzje o kształcie ekranu `/settings`: prezentacja wyboru strefy, bezpieczeństwo resetu, obecność przełącznika widoku. Aktualny stan: brak ekranu (RoutePlaceholder), logika i storage działają.

## Decision

1. **Strefa czasowa**: natywny select na pełnej liście IANA z `Intl.supportedValuesOf('timeZone')` (~400 stref), na szczycie opcja "System default" z dopiskiem strefy rozpoznanej z przeglądarki. Zapis: nazwa IANA albo `'system'` (status quo).
2. **Reset to defaults**: jeden reset przywraca całe DEFAULT_SETTINGS (strefa + pasma + viewMode) **z dialogiem potwierdzenia** — decyzja designera, świadomie ponad idiom undo-toast (5 s) używany w watchliście/teams; reset przestawia trzy pola naraz i jest rzadki, klasyczny confirm wystarcza.
3. **viewMode poza ekranem**: toggle list/cards żyje na kalendarzu (ADR-0006); ustawienia nie dublują źródła prawdy. Reset i tak go przywraca (jest częścią DEFAULT_SETTINGS).

## Impact

- ACTIONS.md (Change timezone, Reset to defaults) zaktualizowane o te notatki.
- Ekran settings: sekcje Timezone / Time bands / Reset — bez sekcji widoku.
- Fallback dla przeglądarek bez `Intl.supportedValuesOf` pozostawiony do rozstrzygnięcia w proto-edgecases.

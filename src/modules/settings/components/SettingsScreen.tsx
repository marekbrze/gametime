import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StorageWarning } from '@/modules/event-calendar/components/StorageWarning';
import { useSettings } from '../hooks/use-settings';
import {
  boundariesFromBands,
  BOUNDARY_STEP,
  DAY_START_MAX,
  DAY_START_MIN,
  EVENING_START_MAX,
  EVENING_START_MIN,
  shiftBoundary,
} from '../lib/band-boundaries';
import { detectedTimezone, groupTimezones, timezoneOptions, zoneLabel } from '../lib/timezones';
import { BandsPreview } from './BandsPreview';
import { ResetDialog } from './ResetDialog';
import { TimeBandStepper } from './TimeBandStepper';

/**
 * Ekran ustawień (spec settings): strefa + pasma napędzają cały system wizualny
 * aplikacji (klasyfikacja, filtry, grupowanie ViewingDay). Zapis natychmiastowy
 * write-first (ADR-0011) — bez przycisku Save; reset przez dialog potwierdzenia
 * (ADR-0026); viewMode żyje na kalendarzu (ADR-0006), tu go nie dublujemy.
 */
export function SettingsScreen() {
  const { settings, updateTimezone, updateBands, reset, writeError } = useSettings();
  const [resetOpen, setResetOpen] = useState(false);
  const storageFailed = Boolean(writeError);

  const systemZone = useMemo(() => detectedTimezone(), []);
  const grouped = useMemo(() => groupTimezones(timezoneOptions()), []);
  const tz = settings.timezone === 'system' ? undefined : settings.timezone;

  // Dwie granice (ADR-0025) odczytane z pasm; przesunięcia ze wzajemnym clampem
  const { dayStart, eveningStart } = boundariesFromBands(settings.bands);
  const shiftDay = (direction: 1 | -1) =>
    updateBands({
      dayStart: shiftBoundary('dayStart', dayStart, direction, eveningStart),
      eveningStart,
    });
  const shiftEvening = (direction: 1 | -1) =>
    updateBands({
      dayStart,
      eveningStart: shiftBoundary('eveningStart', eveningStart, direction, dayStart),
    });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes apply everywhere immediately — no save button.
        </p>
      </header>

      {storageFailed && <StorageWarning />}

      <section aria-labelledby="timezone-heading" className="space-y-2">
        <h2 id="timezone-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Timezone
        </h2>
        <label htmlFor="timezone-select" className="block text-sm font-medium">
          All times are shown in your timezone
        </label>
        <select
          id="timezone-select"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          value={settings.timezone}
          onChange={(e) => updateTimezone(e.target.value)}
        >
          <option value="system">System default ({zoneLabel(systemZone)})</option>
          {grouped.map((group) => (
            <optgroup key={group.region} label={group.region}>
              {group.zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zoneLabel(zone)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {settings.timezone === 'system' && (
          <p className="text-xs text-muted-foreground">
            Detected from your browser: {systemZone}
          </p>
        )}
      </section>

      <section aria-labelledby="bands-heading" className="space-y-3">
        <h2 id="bands-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Time bands
        </h2>
        <p className="text-sm text-muted-foreground">
          Two boundaries decide what counts as day, evening and night — night is pinned to midnight.
        </p>
        <div className="space-y-2 rounded-lg border p-4">
          <TimeBandStepper
            id="day-starts-label"
            label="Day starts"
            value={dayStart}
            onShift={shiftDay}
            canDecrement={dayStart > DAY_START_MIN}
            canIncrement={dayStart < Math.min(DAY_START_MAX, eveningStart - BOUNDARY_STEP)}
          />
          <TimeBandStepper
            id="evening-starts-label"
            label="Evening starts"
            value={eveningStart}
            onShift={shiftEvening}
            canDecrement={eveningStart > Math.max(EVENING_START_MIN, dayStart + BOUNDARY_STEP)}
            canIncrement={eveningStart < EVENING_START_MAX}
          />
          <BandsPreview bands={settings.bands} tz={tz} />
        </div>
        {/* Stały helper (decyzja designera): konsekwencja modelu ViewingDay (ADR-0004) */}
        <p className="text-xs text-muted-foreground">
          After-midnight events belong to the previous evening&apos;s night section.
        </p>
      </section>

      <section aria-labelledby="danger-heading" className="space-y-2 border-t pt-6">
        <h2 id="danger-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Reset
        </h2>
        <p className="text-sm text-muted-foreground">
          Restore timezone, bands and view mode to their defaults.
        </p>
        <Button variant="destructive" onClick={() => setResetOpen(true)}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset to defaults
        </Button>
      </section>

      <ResetDialog open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={reset} />
    </div>
  );
}

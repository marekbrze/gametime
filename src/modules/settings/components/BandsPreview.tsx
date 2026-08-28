import { cn } from '@/lib/utils';
import type { TimeBandKind, UserSettings } from '../types';
import { BAND_DOT } from '../lib/bands-ui';
import { BAND_LABELS } from '../lib/time-bands';
import { formatBandEnd, formatMinutes } from '../lib/band-boundaries';
import { minutesInZone, type TimeZone } from '@/shared/lib/datetime';
import { useNow } from '@/modules/event-calendar/hooks/use-now';

interface BandsPreviewProps {
  bands: UserSettings['bands'];
  /** strefa prezentacji — marker „now" i podpis pasm w aktualnie wybranej strefie (spec) */
  tz: TimeZone;
}

const BAND_ORDER: TimeBandKind[] = ['night', 'day', 'evening'];
const TICKS = [0, 6 * 60, 12 * 60, 18 * 60, 24 * 60];

/**
 * Pasek podglądu 24h (spec settings): proporcjonalne segmenty Night/Day/Evening
 * w kolorach pasm (bands-ui), znaczniki godzin i marker „now" — granice widać
 * w kontekście całej doby zamiast dwóch abstrakcyjnych liczb. Pierwszy
 * „klient systemowy" tokenów pasm (finalne kolory → proto-design).
 */
export function BandsPreview({ bands, tz }: BandsPreviewProps) {
  const now = useNow(30_000);
  const nowMinutes = minutesInZone(now, tz);
  const nowPercent = (nowMinutes / (24 * 60)) * 100;

  const summary = BAND_ORDER.map(
    (kind) =>
      `${BAND_LABELS[kind]} ${formatMinutes(bands[kind].start)}–${formatBandEnd(bands[kind].end)}`,
  ).join(', ');

  return (
    <figure className="mt-4">
      <div
        role="img"
        aria-label={`24-hour preview: ${summary}. Now ${formatMinutes(nowMinutes)}.`}
        className="relative pt-5"
      >
        {/* Marker „now" — nad paskiem, żeby nie kolidował z segmentami */}
        <div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${Math.min(98, Math.max(2, nowPercent))}%` }}
        >
          <span className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium leading-none text-background">
            now {formatMinutes(nowMinutes)}
          </span>
          <span aria-hidden="true" className="mt-0.5 h-[18px] w-0.5 rounded bg-foreground" />
        </div>

        {/* Segmenty pasm — szerokości proporcjonalne do długości pasma */}
        <div className="flex h-8 overflow-hidden rounded-md border">
          {BAND_ORDER.map((kind) => {
            const band = bands[kind];
            const width = ((band.end - band.start) / (24 * 60)) * 100;
            return (
              <div
                key={kind}
                className={cn('flex items-center justify-center', BAND_DOT[kind])}
                style={{ width: `${width}%` }}
              >
                {/* Etykieta tylko gdy segment zmieści tekst (~12% doby) */}
                {width >= 12 && (
                  <span className="px-1 text-xs font-medium text-white">
                    {BAND_LABELS[kind]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Znaczniki godzin */}
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          {TICKS.map((tick) => (
            <span key={tick}>{formatBandEnd(tick)}</span>
          ))}
        </div>
      </div>

      {/* Odczyt zakresów per pasmo (spec) */}
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {BAND_ORDER.map((kind) => (
          <span key={kind} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn('size-2 rounded-full', BAND_DOT[kind])}
            />
            <span className="text-muted-foreground">{BAND_LABELS[kind]}</span>
            <span className="font-medium tabular-nums">
              {formatMinutes(bands[kind].start)} – {formatBandEnd(bands[kind].end)}
            </span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

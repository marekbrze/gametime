import type { TimeBandKind } from '@/modules/settings/types';

/**
 * Słownictwo kolorów pasm (DESIGN.md/ADR-0032): sygnalizacja świetlna —
 * zieleń 150 (dzień) / złoto 85 (wieczór) / czerwień 27 (noc), w obu tematach
 * (tokeny CSS). Metafora czytelna bez nauki: zielono = komfortowo, żółto =
 * prime time, czerwono = po północy.
 *
 * Side-stripe (`border-l-*`, dawne BAND_EDGE) zbanowany absolutnie — wiersz
 * wydarzenia prowadzi kropka (BAND_DOT), kartę i chipy niesie tint pasma.
 * Kolor pasma nigdy nie jest jedynym nośnikiem informacji (etykieta + pozycja).
 */
export const BAND_DOT: Record<TimeBandKind, string> = {
  day: 'bg-band-day',
  evening: 'bg-band-evening',
  night: 'bg-band-night',
};

export const BAND_CHIP: Record<TimeBandKind, string> = {
  day: 'bg-band-day-tint text-band-day-text',
  evening: 'bg-band-evening-tint text-band-evening-text',
  night: 'bg-band-night-tint text-band-night-text',
};

/** Widok cards: kolor pasa mocniej (DESIGN.md — karta niesie tint całej powierzchni). */
export const BAND_CARD: Record<TimeBandKind, string> = {
  day: 'bg-band-day-tint',
  evening: 'bg-band-evening-tint',
  night: 'bg-band-night-tint',
};

/** Czas w kolorze pasma (AA na tintach w obu tematach). */
export const BAND_TIME: Record<TimeBandKind, string> = {
  day: 'text-band-day-text',
  evening: 'text-band-evening-text',
  night: 'text-band-night-text',
};

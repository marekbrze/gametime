import type { TimeBandKind } from '@/modules/settings/types';

/** Lo-fi: trzy rozróżnialne, stonowane odcienie pasm (finalne kolory → proto-design). */
export const BAND_EDGE: Record<TimeBandKind, string> = {
  day: 'border-l-sky-600 dark:border-l-sky-400',
  evening: 'border-l-amber-500 dark:border-l-amber-400',
  night: 'border-l-violet-600 dark:border-l-violet-400',
};

export const BAND_CHIP: Record<TimeBandKind, string> = {
  day: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  evening: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  night: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200',
};

export const BAND_DOT: Record<TimeBandKind, string> = {
  day: 'bg-sky-600 dark:bg-sky-400',
  evening: 'bg-amber-500 dark:bg-amber-400',
  night: 'bg-violet-600 dark:bg-violet-400',
};

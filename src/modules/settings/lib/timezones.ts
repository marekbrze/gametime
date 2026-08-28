/**
 * Lista stref dla selecta (spec settings, ADR-0026): pełna lista IANA z
 * Intl.supportedValuesOf + „System default" z dopiskiem rozpoznanej strefy
 * przeglądarki, grupowanie po kontynentach w <optgroup>.
 */

/** Strefa rozpoznana przez przeglądarkę; 'UTC' jako awaryjny fallback. */
export function detectedTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Pełna lista IANA; przy braku API (stare Safari) krótka lista ręczna. */
export function timezoneOptions(): string[] {
  try {
    const supported = (Intl as unknown as {
      supportedValuesOf?: (key: string) => string[];
    }).supportedValuesOf?.('timeZone');
    if (supported && supported.length > 0) return supported;
  } catch {
    // poniżej fallback
  }
  // Fallback do rozstrzygnięcia w proto-edgecases (spec, Edge Cases); na razie
  // minimalna lista pokrywająca ligi v1 + Polskę.
  return [
    'Europe/Warsaw',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Australia/Sydney',
    'UTC',
  ];
}

export interface TimezoneGroup {
  /** Część przed '/', np. 'Europe'; strefy bez '/' → 'Other'. */
  region: string;
  zones: string[];
}

/** Grupowanie po kontynencie dla <optgroup>. */
export function groupTimezones(zones: string[]): TimezoneGroup[] {
  const groups = new Map<string, string[]>();
  for (const zone of zones) {
    const region = zone.includes('/') ? zone.split('/')[0] : 'Other';
    const list = groups.get(region);
    if (list) list.push(zone);
    else groups.set(region, [zone]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([region, list]) => ({ region, zones: list }));
}

/** "America/New_York" → "New York" (część miejska, podkreślenia na spacje). */
export function zoneLabel(zone: string): string {
  const city = zone.includes('/') ? zone.split('/').slice(1).join(' / ') : zone;
  return city.replace(/_/g, ' ');
}

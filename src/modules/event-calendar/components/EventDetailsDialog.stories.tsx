import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { SportEvent } from '@/modules/data-source/types';
import { DEFAULT_SETTINGS } from '@/modules/settings/types';
import { EventDetailsDialog } from './EventDetailsDialog';

/** Lokalny czas seeda — pasma/statusy liczą się w strefie usera (wzorzec z ekranów). */
function atLocal(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Przełożony mecz + jego nowa instancja (harden #2, ADR-0018) — pokrywa box
 * „Rescheduled" z akcją „Watch new date" (migracja gwiazdki, ADR-0035). */
const postponedEvent: SportEvent = {
  id: 'story-postponed',
  sportId: 'hockey',
  leagueId: 'nhl',
  startUtc: atLocal(1, 19, 30),
  teamIds: ['nhl-bos', 'nhl-det'],
  statusOverride: 'postponed',
};

const rescheduledInstance: SportEvent = {
  id: 'story-postponed-new',
  sportId: 'hockey',
  leagueId: 'nhl',
  startUtc: atLocal(4, 19, 30),
  teamIds: ['nhl-bos', 'nhl-det'],
};

/** Zwyczajny mecz drużynowy — uczestnicy i liga jako linki (ADR-0022, ADR-0035). */
const scheduledEvent: SportEvent = {
  id: 'story-scheduled',
  sportId: 'soccer',
  leagueId: 'premier-league',
  startUtc: atLocal(0, 16, 0),
  teamIds: ['epl-liv', 'epl-mci'],
};

/** Sesja motorsportu — tytuł bez linków uczestników (title-only, ADR-0008). */
const motorsportSession: SportEvent = {
  id: 'story-f1',
  sportId: 'motorsport',
  leagueId: 'f1',
  startUtc: atLocal(2, 15, 0),
  title: 'Dutch GP — Race',
  sessionType: 'race',
};

const allEvents = [postponedEvent, rescheduledInstance, scheduledEvent, motorsportSession];

const meta: Meta<typeof EventDetailsDialog> = {
  title: 'Event Calendar/EventDetailsDialog',
  component: EventDetailsDialog,
  // useNavigate — dialog żyje w MemoryRouter (wzorzec z ekranów, ADR-0020)
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
  args: {
    allEvents,
    onMigrate: () => {},
    settings: DEFAULT_SETTINGS,
    onClose: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof EventDetailsDialog>;

/** ADR-0035: szczegóły przełożonego z nową instancją — box „Rescheduled → nowy
 * termin" + „Watch new date"; uczestnicy i liga klikalne. */
export const PostponedWithNewDate: Story = {
  args: { event: postponedEvent },
};

/** Zwyczajny mecz: uczestnicy → terminarze drużyn, liga → ekran ligi. */
export const Scheduled: Story = {
  args: { event: scheduledEvent },
};

/** Motorsport: tytuł sesji bez linków uczestników; liga (F1) → ekran ligi. */
export const MotorsportSession: Story = {
  args: { event: motorsportSession },
};

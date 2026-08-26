import { useState, type ReactElement } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { leagueCount } from '../lib/filter-events';
import type { FiltersUpdater } from '../hooks/use-url-filters';
import type { EventFilters } from '../types';
import { LeagueFilterPanel } from './LeagueFilterPanel';

interface MoreFiltersProps {
  filters: EventFilters;
  onFiltersChange: (updater: FiltersUpdater) => void;
  leaguesWithEvents: Set<string>;
}

/**
 * Wejście do tieru 2: ten sam panel lig w popoverze (≥md) i bottom sheet
 * (<md, jak dolne taby AppShell) — decyzja lofi. Licznik na przycisku zlicza
 * tylko wybrane ligi (ADR-0012); stosowanie natychmiastowe, panel zostaje
 * otwarty do dalszego togglowania.
 */
export function MoreFilters({ filters, onFiltersChange, leaguesWithEvents }: MoreFiltersProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const count = leagueCount(filters);
  const trigger: ReactElement = (
    <Button variant={count > 0 ? 'default' : 'outline'} size="sm" className="gap-1.5">
      <SlidersHorizontal className="size-3.5" aria-hidden="true" />
      More filters{count > 0 ? ` · ${count}` : ''}
    </Button>
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={trigger} />
        <PopoverContent align="start" className="max-h-96 w-80 overflow-y-auto">
          <PopoverHeader>
            <PopoverTitle>Leagues</PopoverTitle>
            <PopoverDescription>Pick leagues — grouped by sport</PopoverDescription>
          </PopoverHeader>
          <LeagueFilterPanel
            filters={filters}
            onFiltersChange={onFiltersChange}
            leaguesWithEvents={leaguesWithEvents}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger render={trigger} />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Leagues</DrawerTitle>
          <DrawerDescription>Pick leagues — grouped by sport</DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[60dvh] overflow-y-auto px-4 pb-4 pt-2">
          <LeagueFilterPanel
            filters={filters}
            onFiltersChange={onFiltersChange}
            leaguesWithEvents={leaguesWithEvents}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

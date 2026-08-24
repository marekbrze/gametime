import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatWeekRange, weekDayKeys } from '@/shared/lib/datetime';

interface WeekPagerProps {
  /** klucz poniedziałku wyświetlanego tygodnia */
  mondayKey: string;
  onShift: (weeks: number) => void;
  onThisWeek: () => void;
  isCurrentWeek: boolean;
}

export function WeekPager({ mondayKey, onShift, onThisWeek, isCurrentWeek }: WeekPagerProps) {
  const days = weekDayKeys(mondayKey);
  const label = formatWeekRange(days[0], days[6]);

  return (
    <nav aria-label="Week navigation" className="mb-4 flex items-center justify-between gap-2">
      <Button variant="outline" size="icon" aria-label="Previous week" onClick={() => onShift(-1)}>
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium tabular-nums" aria-live="polite">
          {label}
        </span>
        <Button variant="ghost" size="sm" onClick={onThisWeek} disabled={isCurrentWeek}>
          This week
        </Button>
      </div>
      <Button variant="outline" size="icon" aria-label="Next week" onClick={() => onShift(1)}>
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}

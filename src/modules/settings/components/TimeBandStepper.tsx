import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatMinutes } from '../lib/band-boundaries';

interface TimeBandStepperProps {
  /** id dla wartości (aria-labelledby kontrolki z labela sekcji) */
  id: string;
  label: string;
  /** aktualna wartość granicy w minutach doby */
  value: number;
  onShift: (direction: 1 | -1) => void;
  canDecrement: boolean;
  canIncrement: boolean;
  className?: string;
}

/**
 * Stepper granicy pasma (spec settings): krok 30 min, przyciski ± z disabled
 * na krańcach zakresu (clamp liczy caller — wzajemny z drugą granicą).
 * Wartość jako tekst z tabindex="-1" — fokus chodzi po przyciskach, nie po
 * liczbie; aria-live informuje o zmianie wartości czytnikom.
 */
export function TimeBandStepper({
  id,
  label,
  value,
  onShift,
  canDecrement,
  canIncrement,
  className,
}: TimeBandStepperProps) {
  const time = formatMinutes(value);

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <span id={id} className="text-sm font-medium">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={id}
        className="flex items-center gap-1.5"
      >
        <Button
          variant="outline"
          size="icon"
          aria-label={`Decrease ${label}`}
          disabled={!canDecrement}
          onClick={() => onShift(-1)}
        >
          <Minus className="size-4" aria-hidden="true" />
        </Button>
        <output
          aria-live="polite"
          className="w-14 text-center text-sm font-semibold tabular-nums"
        >
          {time}
        </output>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Increase ${label}`}
          disabled={!canIncrement}
          onClick={() => onShift(1)}
        >
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

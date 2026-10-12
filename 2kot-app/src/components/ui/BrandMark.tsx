import { cn } from '../../utils/cn';

interface BrandMarkProps {
  className?: string;
}

/** "2KOT" wordmark; the accented O and T tie it to "Opponent Tracker". */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <div role="img" aria-label="2KOT, Opponent Tracker" className={cn('min-w-0', className)}>
      <div aria-hidden="true" className="brand-mark text-[22px] text-foreground">
        2K<span className="brand-accent">OT</span>
      </div>
      <div aria-hidden="true" className="eyebrow mt-0.5 whitespace-nowrap">
        <span className="font-bold text-primary">O</span>pponent{' '}
        <span className="font-bold text-primary">T</span>racker
      </div>
    </div>
  );
}

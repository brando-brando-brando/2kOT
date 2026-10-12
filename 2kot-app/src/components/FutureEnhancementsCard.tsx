import { Lightbulb } from 'lucide-react';
import { Card, SectionHeader } from './ui/Card';

interface FutureEnhancementsCardProps {
  items: string[];
  className?: string;
}

export function FutureEnhancementsCard({ items, className }: FutureEnhancementsCardProps) {
  return (
    <Card label="Ideas and future enhancements" className={className}>
      <SectionHeader
        title="Ideas / Future Enhancements"
        icon={<Lightbulb className="size-4 shrink-0 text-warning" aria-hidden="true" />}
      />
      <ul className="space-y-1.5 text-xs leading-relaxed text-foreground-secondary">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-primary/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

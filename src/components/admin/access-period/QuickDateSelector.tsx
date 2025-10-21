import { Button } from '@/components/ui/button';
import { Clock, Calendar, Infinity } from 'lucide-react';
import { addDays, addMonths, addYears } from 'date-fns';

interface QuickDateSelectorProps {
  onSelect: (date: Date | null) => void;
}

export function QuickDateSelector({ onSelect }: QuickDateSelectorProps) {
  const quickOptions = [
    { label: '1주일', icon: Clock, getValue: () => addDays(new Date(), 7) },
    { label: '1개월', icon: Calendar, getValue: () => addMonths(new Date(), 1) },
    { label: '3개월', icon: Calendar, getValue: () => addMonths(new Date(), 3) },
    { label: '6개월', icon: Calendar, getValue: () => addMonths(new Date(), 6) },
    { label: '1년', icon: Calendar, getValue: () => addYears(new Date(), 1) },
    { label: '평생소장', icon: Infinity, getValue: () => null },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">빠른 선택</p>
      <div className="grid grid-cols-3 gap-2">
        {quickOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelect(option.getValue())}
              className="gap-2 justify-start"
            >
              <Icon className="h-4 w-4" />
              <span>{option.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

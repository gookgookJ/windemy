import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { QuickDateSelector } from './QuickDateSelector';
import { cn } from '@/lib/utils';

interface Enrollment {
  id: string;
  user_id: string;
  enrolled_at: string;
  expires_at: string | null;
  progress: number;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface ExpiryEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollment: Enrollment | null;
  onSave: (expiryDateTime: string | null) => void;
  isBulk?: boolean;
  selectedCount?: number;
}

export function ExpiryEditModal({
  open,
  onOpenChange,
  enrollment,
  onSave,
  isBulk = false,
  selectedCount = 0
}: ExpiryEditModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('23:59');
  const [isLifetime, setIsLifetime] = useState(false);

  useEffect(() => {
    if (open && enrollment) {
      if (enrollment.expires_at) {
        const expiryDate = parseISO(enrollment.expires_at);
        setSelectedDate(expiryDate);
        setSelectedTime(format(expiryDate, 'HH:mm'));
        setIsLifetime(false);
      } else {
        setSelectedDate(undefined);
        setSelectedTime('23:59');
        setIsLifetime(true);
      }
    }
  }, [open, enrollment]);

  const handleQuickSelect = (date: Date | null) => {
    if (date === null) {
      setIsLifetime(true);
      setSelectedDate(undefined);
    } else {
      setIsLifetime(false);
      setSelectedDate(date);
      setSelectedTime('23:59');
    }
  };

  const handleSave = () => {
    if (isLifetime || !selectedDate) {
      onSave(null);
    } else {
      const [hours, minutes] = selectedTime.split(':');
      const dateTime = new Date(selectedDate);
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      onSave(dateTime.toISOString());
    }
  };

  const getTitle = () => {
    if (isBulk) {
      return `만료일 일괄 변경 (${selectedCount}명)`;
    }
    return '만료일 변경';
  };

  const getDescription = () => {
    if (isBulk) {
      return `선택한 ${selectedCount}명의 수강생 만료일을 일괄 변경합니다.`;
    }
    return `${enrollment?.profiles.full_name}님의 수강 만료일을 변경합니다.`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <QuickDateSelector onSelect={handleQuickSelect} />
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>날짜 선택</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && !isLifetime && "text-muted-foreground"
                    )}
                    disabled={isLifetime}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {isLifetime ? (
                      "평생소장"
                    ) : selectedDate ? (
                      format(selectedDate, 'yyyy년 MM월 dd일')
                    ) : (
                      "날짜를 선택하세요"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!isLifetime && selectedDate && (
              <div className="space-y-2">
                <Label>시간 선택</Label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {isLifetime ? (
                "평생소장으로 설정됩니다."
              ) : selectedDate ? (
                `${format(selectedDate, 'yyyy년 MM월 dd일')} ${selectedTime}까지 수강 가능합니다.`
              ) : (
                "날짜를 선택하거나 빠른 선택을 이용하세요."
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!isLifetime && !selectedDate}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

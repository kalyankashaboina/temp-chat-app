import { useState, forwardRef } from 'react';
import { Clock, Calendar, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, addHours, addDays, setHours, setMinutes, isBefore } from 'date-fns';

interface ScheduleMessageModalProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (scheduledAt: Date) => void;
  translate: (key: string) => string;
}

export const ScheduleMessageModal = forwardRef<HTMLDivElement, ScheduleMessageModalProps>(
  ({ open, onClose, onSchedule, translate }, ref) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [customDate, setCustomDate] = useState('');
    const [customTime, setCustomTime] = useState('');

    const quickOptions = [
      { label: 'In 1 hour', date: addHours(new Date(), 1) },
      { label: 'In 3 hours', date: addHours(new Date(), 3) },
      { label: 'Tomorrow morning', date: setMinutes(setHours(addDays(new Date(), 1), 9), 0) },
      { label: 'Tomorrow evening', date: setMinutes(setHours(addDays(new Date(), 1), 18), 0) },
    ];

    const handleQuickSelect = (date: Date) => {
      setSelectedDate(date);
      setCustomDate('');
      setCustomTime('');
    };

    const handleCustomDateTimeChange = () => {
      if (customDate && customTime) {
        const [hours, minutes] = customTime.split(':').map(Number);
        const date = new Date(customDate);
        date.setHours(hours, minutes, 0, 0);
        if (!isBefore(date, new Date())) {
          setSelectedDate(date);
        }
      }
    };

    const handleSchedule = () => {
      if (selectedDate && !isBefore(selectedDate, new Date())) {
        onSchedule(selectedDate);
        onClose();
        setSelectedDate(null);
        setCustomDate('');
        setCustomTime('');
      }
    };

    const handleClose = () => {
      onClose();
      setSelectedDate(null);
      setCustomDate('');
      setCustomTime('');
    };

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Schedule Message
            </DialogTitle>
          </DialogHeader>

          {/* Quick options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick options</Label>
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSelect(option.date)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    selectedDate?.getTime() === option.date.getTime()
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/20'
                      : 'border-border hover:bg-secondary'
                  }`}
                >
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(option.date, 'MMM d, h:mm a')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom date/time */}
          <div className="space-y-3 pt-2">
            <Label className="text-sm font-medium">Or pick a custom time</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setTimeout(handleCustomDateTimeChange, 0);
                    }}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-32">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="time"
                    value={customTime}
                    onChange={(e) => {
                      setCustomTime(e.target.value);
                      setTimeout(handleCustomDateTimeChange, 0);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Selected time preview */}
          {selectedDate && !isBefore(selectedDate, new Date()) && (
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>
                  Message will be sent on <strong>{format(selectedDate, 'EEEE, MMMM d')}</strong> at{' '}
                  <strong>{format(selectedDate, 'h:mm a')}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              {translate('action.cancel')}
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={!selectedDate || isBefore(selectedDate, new Date())}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

ScheduleMessageModal.displayName = 'ScheduleMessageModal';

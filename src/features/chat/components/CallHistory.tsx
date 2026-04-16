import { CallRecord, User, CallType } from '@/features/chat/types';
import { cn } from '@/lib/utils';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface CallHistoryProps {
  calls: CallRecord[];
  onCallBack: (user: User, type: CallType) => void;
  translate: (key: string) => string;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['bg-primary', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
  return colors[name.charCodeAt(0) % colors.length];
}

function formatCallTime(date: Date): string {
  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d');
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CallHistory({ calls, onCallBack, translate }: CallHistoryProps) {
  if (calls.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
            <Phone className="h-8 w-8 opacity-50" />
          </div>
          <p className="font-medium">{translate('call.noHistory')}</p>
          <p className="text-sm mt-1">Your call history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="flex items-center gap-2 border-b border-sidebar-border p-4">
        <Phone className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-sidebar-foreground">{translate('call.history')}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {calls.map((call) => {
          const CallIcon = call.type === 'video' ? Video : Phone;
          const DirectionIcon = call.status === 'missed' 
            ? PhoneMissed 
            : call.isOutgoing 
              ? PhoneOutgoing 
              : PhoneIncoming;
          
          return (
            <div
              key={call.id}
              className="flex items-center gap-3 p-4 border-b border-sidebar-border hover:bg-secondary/50 transition-colors cursor-pointer group"
              onClick={() => onCallBack(call.user, call.type)}
            >
              {/* Avatar */}
              <div className="relative">
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white',
                  getAvatarColor(call.user.name)
                )}>
                  {getInitials(call.user.name)}
                </div>
              </div>

              {/* Call info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{call.user.name}</p>
                <div className="flex items-center gap-1.5 text-sm">
                  <DirectionIcon className={cn(
                    'h-3.5 w-3.5',
                    call.status === 'missed' ? 'text-destructive' : 'text-muted-foreground'
                  )} />
                  <span className={cn(
                    call.status === 'missed' ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {call.status === 'completed' && call.duration > 0 
                      ? formatDuration(call.duration)
                      : translate(`call.${call.status}`)}
                  </span>
                </div>
              </div>

              {/* Time and call button */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {formatCallTime(call.timestamp)}
                </span>
                <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <CallIcon className="h-4 w-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

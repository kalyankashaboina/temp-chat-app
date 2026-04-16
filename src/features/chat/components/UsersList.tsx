import { User } from '@/features/chat/types';
import { cn } from '@/lib/utils';
import { UserPlus, MessageSquare, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UsersListProps {
  users: User[];
  existingConversationUserIds: string[];
  onStartChat: (user: User) => void;
  translate: (key: string) => string;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['bg-primary', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
  return colors[name.charCodeAt(0) % colors.length];
}

export function UsersList({ users, existingConversationUserIds, onStartChat, translate }: UsersListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableUsers = filteredUsers.filter(u => !existingConversationUserIds.includes(u.id));
  const existingUsers = filteredUsers.filter(u => existingConversationUserIds.includes(u.id));

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="flex items-center gap-2 border-b border-sidebar-border p-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-sidebar-foreground">{translate('users.available')}</h2>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={translate('input.searchUsers')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-0"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                <UserPlus className="h-8 w-8 opacity-50" />
              </div>
              <p className="font-medium">{translate('users.noResults')}</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          </div>
        ) : (
          <>
            {/* Available users (no existing chat) */}
            {availableUsers.length > 0 && (
              <div className="px-3 py-2 bg-primary/5">
                <span className="text-xs text-primary font-medium uppercase tracking-wider">
                  Start New Chat
                </span>
              </div>
            )}
            {availableUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-4 border-b border-sidebar-border hover:bg-secondary/50 transition-colors"
              >
                <div className="relative">
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white',
                    getAvatarColor(user.name)
                  )}>
                    {getInitials(user.name)}
                  </div>
                  <div
                    className={cn(
                      'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-sidebar',
                      user.isOnline ? 'bg-green-500' : 'bg-muted'
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>

                <Button
                  size="sm"
                  onClick={() => onStartChat(user)}
                  className="gap-1.5 shadow-lg shadow-primary/25"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">{translate('action.startChat')}</span>
                </Button>
              </div>
            ))}

            {/* Existing conversations */}
            {existingUsers.length > 0 && (
              <>
                <div className="px-3 py-2 bg-muted/30">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Existing Chats
                  </span>
                </div>
                {existingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-4 border-b border-sidebar-border opacity-60 hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={() => onStartChat(user)}
                  >
                    <div className="relative">
                      <div className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white',
                        getAvatarColor(user.name)
                      )}>
                        {getInitials(user.name)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-muted-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">Already chatting</p>
                    </div>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

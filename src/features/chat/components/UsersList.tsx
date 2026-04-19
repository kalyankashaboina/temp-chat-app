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
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['bg-primary', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
  return colors[name.charCodeAt(0) % colors.length];
}

export function UsersList({
  users,
  existingConversationUserIds,
  onStartChat,
  translate,
}: UsersListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableUsers = filteredUsers.filter((u) => !existingConversationUserIds.includes(u.id));
  const existingUsers = filteredUsers.filter((u) => existingConversationUserIds.includes(u.id));

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-2 border-b border-sidebar-border p-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          {translate('users.available')}
        </h2>
      </div>

      {/* Search */}
      <div className="border-b border-sidebar-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={translate('input.searchUsers')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-muted/50 pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                <UserPlus className="h-8 w-8 opacity-50" />
              </div>
              <p className="font-medium">{translate('users.noResults')}</p>
              <p className="mt-1 text-sm">Try a different search term</p>
            </div>
          </div>
        ) : (
          <>
            {/* Available users (no existing chat) */}
            {availableUsers.length > 0 && (
              <div className="bg-primary/5 px-3 py-2">
                <span className="text-xs font-medium uppercase tracking-wider text-primary">
                  Start New Chat
                </span>
              </div>
            )}
            {availableUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 border-b border-sidebar-border p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="relative">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white',
                      getAvatarColor(user.name)
                    )}
                  >
                    {getInitials(user.name)}
                  </div>
                  <div
                    className={cn(
                      'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-sidebar',
                      user.isOnline ? 'bg-green-500' : 'bg-muted'
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{user.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
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
                <div className="bg-muted/30 px-3 py-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Existing Chats
                  </span>
                </div>
                {existingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-sidebar-border p-4 opacity-60 transition-opacity hover:opacity-80"
                    onClick={() => onStartChat(user)}
                  >
                    <div className="relative">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white',
                          getAvatarColor(user.name)
                        )}
                      >
                        {getInitials(user.name)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-muted-foreground">{user.name}</p>
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

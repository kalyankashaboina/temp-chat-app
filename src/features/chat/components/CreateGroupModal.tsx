import { useState } from 'react';
import { User } from '@/features/chat/types';
import { cn } from '@/lib/utils';
import { X, Users, Check, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  users: User[];
  onCreateGroup: (name: string, members: User[]) => void;
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

export function CreateGroupModal({
  open,
  onClose,
  users,
  onCreateGroup,
  translate,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (user: User) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  };

  const handleCreate = () => {
    if (groupName.trim() && selectedUsers.length >= 2) {
      onCreateGroup(groupName.trim(), selectedUsers);
      setGroupName('');
      setSelectedUsers([]);
      setSearchQuery('');
      onClose();
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedUsers([]);
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            {translate('group.create')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Name */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              {translate('group.name')}
            </label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={translate('group.namePlaceholder')}
              className="mt-1"
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-sm text-primary"
                >
                  <span>{user.name.split(' ')[0]}</span>
                  <button
                    onClick={() => toggleUser(user)}
                    className="ml-0.5 transition-colors hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translate('input.searchUsers')}
              className="pl-10"
            />
          </div>

          {/* User List */}
          <div className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
            {filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No users found</div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg p-2.5 transition-all',
                      isSelected
                        ? 'border border-primary/20 bg-primary/10'
                        : 'border border-transparent hover:bg-muted'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white',
                        getAvatarColor(user.name)
                      )}
                    >
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              {translate('action.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!groupName.trim() || selectedUsers.length < 2}
              className="flex-1 shadow-lg shadow-primary/25"
            >
              {translate('group.createButton')} ({selectedUsers.length})
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {translate('group.minMembers')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

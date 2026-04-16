import { useState, useRef, useEffect } from 'react';
import { Plus, Image, Video, Music, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttachmentMenuProps {
  onFileSelect: (files: FileList, type: 'image' | 'video' | 'audio' | 'file') => void;
  translate: (key: string) => string;
  className?: string;
}

const MENU_ITEMS = [
  { 
    type: 'image' as const, 
    icon: Image, 
    labelKey: 'upload.image',
    accept: 'image/*',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  { 
    type: 'video' as const, 
    icon: Video, 
    labelKey: 'upload.video',
    accept: 'video/*',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  { 
    type: 'audio' as const, 
    icon: Music, 
    labelKey: 'upload.audio',
    accept: 'audio/*',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  { 
    type: 'file' as const, 
    icon: FileText, 
    labelKey: 'upload.file',
    accept: '.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
];

export function AttachmentMenu({ onFileSelect, translate, className }: AttachmentMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (type: typeof MENU_ITEMS[number]['type']) => {
    const input = fileInputRefs.current[type];
    if (input) {
      input.click();
    }
  };

  const handleFileChange = (type: typeof MENU_ITEMS[number]['type'], e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files, type);
      setIsOpen(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      {/* Hidden file inputs */}
      {MENU_ITEMS.map((item) => (
        <input
          key={item.type}
          ref={(el) => (fileInputRefs.current[item.type] = el)}
          type="file"
          multiple
          accept={item.accept}
          onChange={(e) => handleFileChange(item.type, e)}
          className="hidden"
        />
      ))}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200',
          isOpen
            ? 'bg-primary text-primary-foreground rotate-45'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>

      {/* Menu */}
      {isOpen && (
        <div className="absolute bottom-12 left-0 z-50 flex flex-col gap-2 rounded-xl border border-border bg-card p-2 shadow-xl animate-fade-in">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => handleItemClick(item.type)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-muted',
                  'min-w-[140px]'
                )}
              >
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', item.bgColor)}>
                  <Icon className={cn('h-4 w-4', item.color)} />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {translate(item.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

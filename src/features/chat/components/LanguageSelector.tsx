import { useChat } from '@/features/chat/useChat';
import { getAvailableLanguages } from '@/shared/lib/i18n';
import { Language } from '@/features/chat/types';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LanguageSelector() {
  const { language, setLanguage } = useChat();
  const languages = getAvailableLanguages();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <div className="flex rounded-lg bg-secondary p-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code as Language)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-all duration-200',
              language === lang.code
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
}

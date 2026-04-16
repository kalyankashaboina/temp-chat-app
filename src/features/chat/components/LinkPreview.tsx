import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Link2, Globe, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkMetadata {
  url: string;
  title: string;
  description: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

// Mock function to simulate fetching link metadata
// In production, this would call an API endpoint
function extractLinksFromText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

function getMockMetadata(url: string): LinkMetadata {
  // Simulate different websites
  const mockData: Record<string, LinkMetadata> = {
    'github.com': {
      url,
      title: 'GitHub - Build software better, together',
      description: 'GitHub is where people build software. More than 100 million developers use GitHub to discover, fork, and contribute to over 420 million projects.',
      image: 'https://github.githubassets.com/images/modules/open_graph/github-mark.png',
      siteName: 'GitHub',
    },
    'youtube.com': {
      url,
      title: 'YouTube - Share your videos with friends, family, and the world',
      description: 'Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube.',
      image: 'https://www.youtube.com/img/desktop/yt_1200.png',
      siteName: 'YouTube',
    },
    'twitter.com': {
      url,
      title: 'X (formerly Twitter)',
      description: 'From breaking news and entertainment to sports and politics, get the full story with all the live commentary.',
      siteName: 'X',
    },
    'linkedin.com': {
      url,
      title: 'LinkedIn: Log In or Sign Up',
      description: 'LinkedIn is the world\'s largest professional network with more than 900 million members worldwide.',
      siteName: 'LinkedIn',
    },
  };

  // Extract domain from URL
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const matchedSite = Object.keys(mockData).find(site => domain.includes(site));
    if (matchedSite) {
      return mockData[matchedSite];
    }
  } catch {
    // Invalid URL
  }

  // Default fallback
  return {
    url,
    title: url.substring(0, 50),
    description: 'Click to open this link',
    siteName: new URL(url).hostname || 'External Link',
  };
}

interface LinkPreviewProps {
  content: string;
  isOwn: boolean;
  compact?: boolean;
}

export function LinkPreview({ content, isOwn, compact = false }: LinkPreviewProps) {
  const [previews, setPreviews] = useState<LinkMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissedUrls, setDismissedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    const links = extractLinksFromText(content);
    if (links.length === 0) {
      setPreviews([]);
      return;
    }

    setLoading(true);
    
    // Simulate async fetch with a small delay
    const timer = setTimeout(() => {
      const metadata = links
        .filter(url => !dismissedUrls.has(url))
        .slice(0, 2) // Limit to 2 previews
        .map(url => getMockMetadata(url));
      setPreviews(metadata);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [content, dismissedUrls]);

  const handleDismiss = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedUrls(prev => new Set([...prev, url]));
  };

  if (previews.length === 0 && !loading) return null;

  return (
    <AnimatePresence>
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2 mt-2 text-xs text-muted-foreground"
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          <span>Loading preview...</span>
        </motion.div>
      ) : (
        <div className="mt-2 space-y-2">
          {previews.map((preview, index) => (
            <motion.a
              key={preview.url}
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'block rounded-xl overflow-hidden border transition-all hover:shadow-lg group relative',
                isOwn
                  ? 'bg-primary-foreground/10 border-primary-foreground/20 hover:border-primary-foreground/40'
                  : 'bg-muted/50 border-border hover:border-primary/30'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dismiss button */}
              <button
                onClick={(e) => handleDismiss(preview.url, e)}
                className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>

              {preview.image && !compact && (
                <div className="relative h-32 w-full overflow-hidden bg-muted">
                  <img
                    src={preview.image}
                    alt={preview.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className={cn('p-3', compact && 'flex items-center gap-3')}>
                {compact && (
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  {/* Site name */}
                  <div className={cn(
                    'flex items-center gap-1.5 text-xs mb-1',
                    isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}>
                    <Link2 className="h-3 w-3" />
                    <span className="truncate">{preview.siteName}</span>
                  </div>
                  
                  {/* Title */}
                  <h4 className={cn(
                    'font-medium text-sm line-clamp-1 group-hover:underline',
                    isOwn ? 'text-primary-foreground' : 'text-foreground'
                  )}>
                    {preview.title}
                  </h4>
                  
                  {/* Description */}
                  {!compact && (
                    <p className={cn(
                      'text-xs line-clamp-2 mt-1',
                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {preview.description}
                    </p>
                  )}
                </div>

                <ExternalLink className={cn(
                  'h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                  isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )} />
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Utility to check if text contains any links
export function hasLinks(text: string): boolean {
  return extractLinksFromText(text).length > 0;
}

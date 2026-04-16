import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarkdownRendererProps {
  content: string;
  isOwn?: boolean;
  className?: string;
}

export function MarkdownRenderer({ content, isOwn, className }: MarkdownRendererProps) {
  // Check if content contains markdown-like syntax
  const hasMarkdown = /(\*\*|__|```|`|#{1,6}\s|\[.*\]\(.*\)|^\s*[-*+]\s|^\s*\d+\.\s|^\|)/m.test(content);

  if (!hasMarkdown) {
    return <p className={cn("text-sm leading-relaxed whitespace-pre-wrap break-words", className)}>{content}</p>;
  }

  return (
    <div className={cn("markdown-content text-sm leading-relaxed break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>
          ),
          
          // Bold
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          
          // Italic
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          
          // Inline code
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className={cn(
                    "px-1.5 py-0.5 rounded text-xs font-mono",
                    isOwn ? "bg-primary-foreground/20" : "bg-muted"
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          
          // Code blocks
          pre: ({ children }) => (
            <pre className={cn(
              "p-3 rounded-lg my-2 overflow-x-auto text-xs font-mono",
              isOwn ? "bg-primary-foreground/20" : "bg-muted"
            )}>
              {children}
            </pre>
          ),
          
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1 underline underline-offset-2 hover:no-underline transition-all",
                isOwn ? "text-primary-foreground/90 hover:text-primary-foreground" : "text-primary hover:text-primary/80"
              )}
            >
              {children}
              <ExternalLink className="h-3 w-3 inline-block" />
            </a>
          ),
          
          // Unordered lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
          ),
          
          // Ordered lists
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
          ),
          
          // List items
          li: ({ children }) => (
            <li className="text-sm">{children}</li>
          ),
          
          // Headings
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-medium mb-1 mt-2 first:mt-0">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium mb-1 mt-2 first:mt-0">{children}</h6>
          ),
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className={cn(
              "border-l-3 pl-3 my-2 italic",
              isOwn ? "border-primary-foreground/50" : "border-primary/50"
            )}>
              {children}
            </blockquote>
          ),
          
          // Tables
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className={cn(
                "min-w-full border-collapse text-xs",
                isOwn ? "border-primary-foreground/30" : "border-border"
              )}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={cn(
              isOwn ? "bg-primary-foreground/10" : "bg-muted"
            )}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody>{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className={cn(
              "border-b",
              isOwn ? "border-primary-foreground/20" : "border-border"
            )}>
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1.5 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1.5">{children}</td>
          ),
          
          // Horizontal rule
          hr: () => (
            <hr className={cn(
              "my-3",
              isOwn ? "border-primary-foreground/30" : "border-border"
            )} />
          ),
          
          // Checkbox (GFM)
          input: ({ type, checked }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 rounded pointer-events-none"
                />
              );
            }
            return null;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Interactive button component for AI responses
interface MessageButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

export function MessageButton({ label, onClick, variant = 'default' }: MessageButtonProps) {
  return (
    <Button
      size="sm"
      variant={variant}
      onClick={onClick}
      className="h-7 text-xs"
    >
      {label}
    </Button>
  );
}

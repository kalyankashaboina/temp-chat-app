import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { mockProfileApi } from '@/features/profile/profileService';
import { FAQItem } from '@/features/profile/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HelpScreenProps {
  open: boolean;
  onClose: () => void;
}

export function HelpScreen({ open, onClose }: HelpScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Feedback form
  const [feedbackCategory, setFeedbackCategory] = useState('general');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (open) {
      loadFAQs();
    }
  }, [open]);

  const loadFAQs = async () => {
    setIsLoading(true);
    try {
      const data = await mockProfileApi.getFAQs();
      setFaqs(data);
    } catch (error) {
      toast.error('Failed to load FAQs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await mockProfileApi.submitFeedback(feedbackMessage, feedbackCategory);
      toast.success('Thank you for your feedback!');
      setShowFeedback(false);
      setFeedbackMessage('');
      setFeedbackCategory('general');
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const groupedFaqs = faqs.reduce(
    (acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    },
    {} as Record<string, FAQItem[]>
  );

  const helpItems = [
    {
      icon: HelpCircle,
      label: 'Frequently Asked Questions',
      description: 'Find answers to common questions',
      action: () => {},
      isExpanded: true,
    },
    {
      icon: MessageCircle,
      label: 'Contact Support',
      description: 'Send us your feedback or report issues',
      action: () => setShowFeedback(true),
    },
    {
      icon: FileText,
      label: 'Terms of Service',
      description: 'Read our terms and conditions',
      action: () => window.open('#', '_blank'),
      external: true,
    },
    {
      icon: FileText,
      label: 'Privacy Policy',
      description: 'Learn how we protect your data',
      action: () => window.open('#', '_blank'),
      external: true,
    },
    {
      icon: Info,
      label: 'About',
      description: 'App version and information',
      action: () => setShowAbout(true),
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="flex h-[90vh] max-h-[700px] w-[95vw] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full">
          <DialogHeader className="flex-shrink-0 border-b border-border p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <DialogTitle className="text-base sm:text-lg">Help & Support</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quick Actions */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="space-y-2">
                    {helpItems.slice(1).map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                        >
                          <div className="rounded-lg bg-primary/10 p-2.5">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                          {item.external && (
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* FAQs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Frequently Asked Questions
                  </h3>

                  {Object.entries(groupedFaqs).map(([category, items]) => (
                    <div key={category} className="mb-4">
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">{category}</h4>
                      <div className="overflow-hidden rounded-xl border border-border bg-card">
                        {items.map((faq, index) => (
                          <div
                            key={faq.id}
                            className={cn(index !== items.length - 1 && 'border-b border-border')}
                          >
                            <button
                              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
                            >
                              <span className="pr-4 text-sm font-medium">{faq.question}</span>
                              {expandedFaq === faq.id ? (
                                <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                              )}
                            </button>
                            <AnimatePresence>
                              {expandedFaq === faq.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <p className="px-4 pb-4 text-sm text-muted-foreground">
                                    {faq.answer}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>
              Send us your feedback, suggestions, or report any issues
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={feedbackCategory} onValueChange={setFeedbackCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Feedback</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="account">Account Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={5}
                maxLength={1000}
                className="resize-none"
              />
              <p className="text-right text-xs text-muted-foreground">
                {feedbackMessage.length}/1000
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedback(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback} disabled={isSubmittingFeedback}>
              {isSubmittingFeedback ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* About Modal */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-8">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <MessageCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-bold">ChatApp</h2>
            <p className="mb-4 text-sm text-muted-foreground">Version 1.0.0</p>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>© 2024 ChatApp. All rights reserved.</p>
              <p>Built with ❤️ using React</p>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <p className="text-xs text-muted-foreground">End-to-end encrypted messaging</p>
              <p className="mt-2 text-xs text-primary">🔒 Your messages are secure</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

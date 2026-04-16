import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, MessageCircle, FileText, Info, ChevronDown, ChevronUp, Send, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

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
        <DialogContent className="max-w-lg w-[95vw] sm:w-full h-[90vh] max-h-[700px] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-3 sm:p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <DialogTitle className="text-base sm:text-lg">Help & Support</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="space-y-2">
                    {helpItems.slice(1).map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="p-2.5 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                          </div>
                          {item.external && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
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
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                    Frequently Asked Questions
                  </h3>
                  
                  {Object.entries(groupedFaqs).map(([category, items]) => (
                    <div key={category} className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                      <div className="bg-card rounded-xl border border-border overflow-hidden">
                        {items.map((faq, index) => (
                          <div
                            key={faq.id}
                            className={cn(
                              index !== items.length - 1 && 'border-b border-border'
                            )}
                          >
                            <button
                              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                            >
                              <span className="text-sm font-medium pr-4">{faq.question}</span>
                              {expandedFaq === faq.id ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
              <p className="text-xs text-muted-foreground text-right">
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
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
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
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">ChatApp</h2>
            <p className="text-muted-foreground text-sm mb-4">Version 1.0.0</p>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>© 2024 ChatApp. All rights reserved.</p>
              <p>Built with ❤️ using React</p>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground">
                End-to-end encrypted messaging
              </p>
              <p className="text-xs text-primary mt-2">🔒 Your messages are secure</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

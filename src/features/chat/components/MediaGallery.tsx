import { useState, useMemo } from 'react';
import { useChat } from '@/features/chat/useChat';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image,
  FileText,
  Music,
  Video,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileAttachment } from '@/features/chat/types';

interface MediaGalleryProps {
  open: boolean;
  onClose: () => void;
}

type MediaTab = 'images' | 'videos' | 'documents' | 'audio';

export function MediaGallery({ open, onClose }: MediaGalleryProps) {
  const { messages, translate, activeConversation } = useChat();
  const [selectedMedia, setSelectedMedia] = useState<FileAttachment | null>(null);
  const [activeTab, setActiveTab] = useState<MediaTab>('images');

  // Get all media from current conversation's messages
  const allMedia = useMemo(() => {
    const conversationMessages = messages.filter((m) => !m.isDeleted && m.attachments.length > 0);

    const media: Record<MediaTab, FileAttachment[]> = {
      images: [],
      videos: [],
      documents: [],
      audio: [],
    };

    conversationMessages.forEach((msg) => {
      msg.attachments.forEach((att) => {
        if (att.type === 'image') media.images.push(att);
        else if (att.type === 'video') media.videos.push(att);
        else if (att.type === 'audio') media.audio.push(att);
        else media.documents.push(att);
      });
    });

    return media;
  }, [messages]);

  const currentMedia = allMedia[activeTab];
  const currentIndex = selectedMedia
    ? currentMedia.findIndex((m) => m.id === selectedMedia.id)
    : -1;

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (!selectedMedia) return;
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < currentMedia.length) {
      setSelectedMedia(currentMedia[newIndex]);
    }
  };

  const tabConfig = [
    {
      id: 'images' as const,
      label: translate('media.images'),
      icon: Image,
      count: allMedia.images.length,
    },
    {
      id: 'videos' as const,
      label: translate('media.videos'),
      icon: Video,
      count: allMedia.videos.length,
    },
    {
      id: 'documents' as const,
      label: translate('media.documents'),
      icon: FileText,
      count: allMedia.documents.length,
    },
    {
      id: 'audio' as const,
      label: translate('media.audio'),
      icon: Music,
      count: allMedia.audio.length,
    },
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      <Dialog open={open && !selectedMedia} onOpenChange={onClose}>
        <DialogContent className="flex h-[85vh] max-h-[700px] w-[95vw] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:h-[80vh] sm:w-full">
          <DialogHeader className="flex-shrink-0 border-b border-border p-3 sm:p-4">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Image className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              <span className="truncate">{translate('media.gallery')}</span>
              {activeConversation && (
                <span className="xs:inline hidden truncate text-xs font-normal text-muted-foreground sm:text-sm">
                  -{' '}
                  {activeConversation.isGroup
                    ? activeConversation.groupName
                    : activeConversation.user?.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as MediaTab)}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <TabsList className="mx-2 mt-2 grid h-auto flex-shrink-0 grid-cols-4 sm:mx-4 sm:mt-4">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="px-1 py-2 text-[10px] sm:px-3 sm:text-sm"
                  >
                    <Icon className="h-3 w-3 sm:mr-1.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="ml-0.5 rounded-full bg-muted px-1 py-0.5 text-[10px] sm:ml-1.5 sm:px-1.5">
                        {tab.count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4">
              {currentMedia.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <div className="mb-4 rounded-full bg-muted/50 p-4">
                    {activeTab === 'images' && <Image className="h-8 w-8" />}
                    {activeTab === 'videos' && <Video className="h-8 w-8" />}
                    {activeTab === 'documents' && <FileText className="h-8 w-8" />}
                    {activeTab === 'audio' && <Music className="h-8 w-8" />}
                  </div>
                  <p className="text-sm">{translate('media.empty')}</p>
                </div>
              ) : (
                <div
                  className={cn(
                    'grid gap-2',
                    activeTab === 'images' || activeTab === 'videos'
                      ? 'grid-cols-3 sm:grid-cols-4'
                      : 'grid-cols-1'
                  )}
                >
                  {currentMedia.map((media, index) => (
                    <motion.button
                      key={media.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedMedia(media)}
                      className={cn(
                        'group relative overflow-hidden rounded-lg border border-border transition-all hover:border-primary',
                        activeTab === 'images' || activeTab === 'videos'
                          ? 'aspect-square'
                          : 'flex items-center gap-3 p-3'
                      )}
                    >
                      {activeTab === 'images' ? (
                        <>
                          <img
                            src={media.url}
                            alt={media.name}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-colors group-hover:bg-black/40 group-hover:opacity-100">
                            <ZoomIn className="h-6 w-6 text-white" />
                          </div>
                        </>
                      ) : activeTab === 'videos' ? (
                        <>
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-colors group-hover:bg-black/40 group-hover:opacity-100">
                            <ZoomIn className="h-6 w-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2">
                            {activeTab === 'audio' ? (
                              <Music className="h-5 w-5 text-primary" />
                            ) : (
                              <FileText className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="truncate text-sm font-medium text-foreground">
                              {media.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(media.size)}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                        </>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Full screen media viewer */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/95"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedMedia(null)}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
                <div>
                  <p className="max-w-[200px] truncate font-medium sm:max-w-none">
                    {selectedMedia.name}
                  </p>
                  <p className="text-xs text-white/60">{formatFileSize(selectedMedia.size)}</p>
                </div>
              </div>
              <a
                href={selectedMedia.url}
                download={selectedMedia.name}
                className="rounded-lg p-2 transition-colors hover:bg-white/10"
              >
                <Download className="h-5 w-5" />
              </a>
            </div>

            {/* Media content */}
            <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
              {/* Navigation buttons */}
              {currentIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMedia('prev')}
                  className="absolute left-2 z-10 text-white hover:bg-white/10 sm:left-4"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              {currentIndex < currentMedia.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMedia('next')}
                  className="absolute right-2 z-10 text-white hover:bg-white/10 sm:right-4"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Content */}
              <motion.div
                key={selectedMedia.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-h-full max-w-full"
              >
                {selectedMedia.type === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.name}
                    className="max-h-[calc(100vh-120px)] max-w-full rounded-lg object-contain"
                  />
                ) : selectedMedia.type === 'video' ? (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="max-h-[calc(100vh-120px)] max-w-full rounded-lg"
                  />
                ) : selectedMedia.type === 'audio' ? (
                  <div className="rounded-xl bg-card p-8">
                    <Music className="mx-auto mb-4 h-16 w-16 text-primary" />
                    <audio src={selectedMedia.url} controls className="w-full" />
                  </div>
                ) : (
                  <div className="rounded-xl bg-card p-8 text-center">
                    <FileText className="mx-auto mb-4 h-16 w-16 text-primary" />
                    <p className="font-medium text-foreground">{selectedMedia.name}</p>
                    <a
                      href={selectedMedia.url}
                      download={selectedMedia.name}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Thumbnail strip */}
            {currentMedia.length > 1 && (activeTab === 'images' || activeTab === 'videos') && (
              <div className="overflow-x-auto p-4">
                <div className="flex justify-center gap-2">
                  {currentMedia.map((media, index) => (
                    <button
                      key={media.id}
                      onClick={() => setSelectedMedia(media)}
                      className={cn(
                        'h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-16 sm:w-16',
                        selectedMedia.id === media.id
                          ? 'border-primary'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      )}
                    >
                      {media.type === 'image' ? (
                        <img src={media.url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Video className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

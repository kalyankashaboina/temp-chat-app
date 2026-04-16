import { useState, useMemo } from 'react';
import { useChat } from '@/features/chat/useChat';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image, FileText, Music, Video, Download, X, 
  ChevronLeft, ChevronRight, ZoomIn, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    const conversationMessages = messages.filter(m => 
      !m.isDeleted && m.attachments.length > 0
    );
    
    const media: Record<MediaTab, FileAttachment[]> = {
      images: [],
      videos: [],
      documents: [],
      audio: [],
    };

    conversationMessages.forEach(msg => {
      msg.attachments.forEach(att => {
        if (att.type === 'image') media.images.push(att);
        else if (att.type === 'video') media.videos.push(att);
        else if (att.type === 'audio') media.audio.push(att);
        else media.documents.push(att);
      });
    });

    return media;
  }, [messages]);

  const currentMedia = allMedia[activeTab];
  const currentIndex = selectedMedia ? currentMedia.findIndex(m => m.id === selectedMedia.id) : -1;

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (!selectedMedia) return;
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < currentMedia.length) {
      setSelectedMedia(currentMedia[newIndex]);
    }
  };

  const tabConfig = [
    { id: 'images' as const, label: translate('media.images'), icon: Image, count: allMedia.images.length },
    { id: 'videos' as const, label: translate('media.videos'), icon: Video, count: allMedia.videos.length },
    { id: 'documents' as const, label: translate('media.documents'), icon: FileText, count: allMedia.documents.length },
    { id: 'audio' as const, label: translate('media.audio'), icon: Music, count: allMedia.audio.length },
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      <Dialog open={open && !selectedMedia} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full h-[85vh] sm:h-[80vh] max-h-[700px] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-3 sm:p-4 border-b border-border flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Image className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="truncate">{translate('media.gallery')}</span>
              {activeConversation && (
                <span className="text-xs sm:text-sm text-muted-foreground font-normal truncate hidden xs:inline">
                  - {activeConversation.isGroup ? activeConversation.groupName : activeConversation.user?.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MediaTab)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-4 mx-2 sm:mx-4 mt-2 sm:mt-4 flex-shrink-0 h-auto">
              {tabConfig.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="text-[10px] sm:text-sm py-2 px-1 sm:px-3">
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="ml-0.5 sm:ml-1.5 text-[10px] bg-muted px-1 sm:px-1.5 py-0.5 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4">
              {currentMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    {activeTab === 'images' && <Image className="h-8 w-8" />}
                    {activeTab === 'videos' && <Video className="h-8 w-8" />}
                    {activeTab === 'documents' && <FileText className="h-8 w-8" />}
                    {activeTab === 'audio' && <Music className="h-8 w-8" />}
                  </div>
                  <p className="text-sm">{translate('media.empty')}</p>
                </div>
              ) : (
                <div className={cn(
                  'grid gap-2',
                  activeTab === 'images' || activeTab === 'videos'
                    ? 'grid-cols-3 sm:grid-cols-4'
                    : 'grid-cols-1'
                )}>
                  {currentMedia.map((media, index) => (
                    <motion.button
                      key={media.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedMedia(media)}
                      className={cn(
                        'relative overflow-hidden rounded-lg border border-border hover:border-primary transition-all group',
                        activeTab === 'images' || activeTab === 'videos'
                          ? 'aspect-square'
                          : 'p-3 flex items-center gap-3'
                      )}
                    >
                      {activeTab === 'images' ? (
                        <>
                          <img 
                            src={media.url} 
                            alt={media.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="h-6 w-6 text-white" />
                          </div>
                        </>
                      ) : activeTab === 'videos' ? (
                        <>
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="h-6 w-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                            {activeTab === 'audio' ? (
                              <Music className="h-5 w-5 text-primary" />
                            ) : (
                              <FileText className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium text-foreground truncate">{media.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(media.size)}</p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedMedia(null)} className="text-white hover:bg-white/10">
                  <X className="h-5 w-5" />
                </Button>
                <div>
                  <p className="font-medium truncate max-w-[200px] sm:max-w-none">{selectedMedia.name}</p>
                  <p className="text-xs text-white/60">{formatFileSize(selectedMedia.size)}</p>
                </div>
              </div>
              <a 
                href={selectedMedia.url} 
                download={selectedMedia.name}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Download className="h-5 w-5" />
              </a>
            </div>

            {/* Media content */}
            <div className="flex-1 flex items-center justify-center px-4 pb-4 relative">
              {/* Navigation buttons */}
              {currentIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMedia('prev')}
                  className="absolute left-2 sm:left-4 text-white hover:bg-white/10 z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              {currentIndex < currentMedia.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMedia('next')}
                  className="absolute right-2 sm:right-4 text-white hover:bg-white/10 z-10"
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
                className="max-w-full max-h-full"
              >
                {selectedMedia.type === 'image' ? (
                  <img 
                    src={selectedMedia.url} 
                    alt={selectedMedia.name}
                    className="max-w-full max-h-[calc(100vh-120px)] object-contain rounded-lg"
                  />
                ) : selectedMedia.type === 'video' ? (
                  <video 
                    src={selectedMedia.url}
                    controls
                    className="max-w-full max-h-[calc(100vh-120px)] rounded-lg"
                  />
                ) : selectedMedia.type === 'audio' ? (
                  <div className="p-8 bg-card rounded-xl">
                    <Music className="h-16 w-16 text-primary mx-auto mb-4" />
                    <audio src={selectedMedia.url} controls className="w-full" />
                  </div>
                ) : (
                  <div className="p-8 bg-card rounded-xl text-center">
                    <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
                    <p className="text-foreground font-medium">{selectedMedia.name}</p>
                    <a 
                      href={selectedMedia.url}
                      download={selectedMedia.name}
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
              <div className="p-4 overflow-x-auto">
                <div className="flex gap-2 justify-center">
                  {currentMedia.map((media, index) => (
                    <button
                      key={media.id}
                      onClick={() => setSelectedMedia(media)}
                      className={cn(
                        'w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all',
                        selectedMedia.id === media.id 
                          ? 'border-primary' 
                          : 'border-transparent opacity-60 hover:opacity-100'
                      )}
                    >
                      {media.type === 'image' ? (
                        <img src={media.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
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

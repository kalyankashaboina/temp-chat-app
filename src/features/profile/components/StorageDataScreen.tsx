import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Database, Image, FileText, Trash2, HardDrive, Loader2, RefreshCw, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { mockProfileApi } from '@/features/profile/profileService';
import { StorageStats } from '@/features/profile/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StorageDataScreenProps {
  open: boolean;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function StorageDataScreen({ open, onClose }: StorageDataScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  useEffect(() => {
    if (open) {
      loadStats();
    }
  }, [open]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await mockProfileApi.getStorageStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load storage stats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await mockProfileApi.clearCache();
      if (stats) {
        setStats({ ...stats, cacheSize: 0 });
      }
      toast.success('Cache cleared successfully');
    } catch (error) {
      toast.error('Failed to clear cache');
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleClearAllData = async () => {
    setIsClearingAll(true);
    try {
      await mockProfileApi.clearAllData();
      toast.success('All data cleared');
      setShowClearAllDialog(false);
      onClose();
    } catch (error) {
      toast.error('Failed to clear data');
    } finally {
      setIsClearingAll(false);
    }
  };

  const storageItems = stats ? [
    {
      icon: Image,
      label: 'Media',
      size: stats.mediaSize,
      color: 'bg-blue-500',
      percentage: (stats.mediaSize / stats.totalSize) * 100,
    },
    {
      icon: FileText,
      label: 'Documents',
      size: stats.documentsSize,
      color: 'bg-green-500',
      percentage: (stats.documentsSize / stats.totalSize) * 100,
    },
    {
      icon: Database,
      label: 'Cache',
      size: stats.cacheSize,
      color: 'bg-yellow-500',
      percentage: (stats.cacheSize / stats.totalSize) * 100,
    },
  ] : [];

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full h-[90vh] max-h-[700px] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-3 sm:p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <DialogTitle className="text-base sm:text-lg">Storage & Data</DialogTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={loadStats} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : stats && (
              <div className="space-y-6">
                {/* Total Storage */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border border-border p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <HardDrive className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Usage</p>
                        <p className="text-2xl font-bold text-primary">{formatBytes(stats.totalSize)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Storage breakdown */}
                  <div className="space-y-4">
                    {storageItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={cn("h-3 w-3 rounded-full", item.color)} />
                              <span className="text-sm">{item.label}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{formatBytes(item.size)}</span>
                          </div>
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card rounded-xl border border-border p-4 text-center">
                      <MessageSquare className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats.messagesCount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Messages</p>
                    </div>
                    <div className="bg-card rounded-xl border border-border p-4 text-center">
                      <Image className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats.mediaCount}</p>
                      <p className="text-xs text-muted-foreground">Media Files</p>
                    </div>
                  </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    Manage Storage
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={handleClearCache}
                      disabled={isClearingCache || stats.cacheSize === 0}
                      className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="p-2.5 rounded-lg bg-yellow-500/10">
                        {isClearingCache ? (
                          <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                        ) : (
                          <Database className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Clear Cache</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.cacheSize === 0 ? 'Cache is empty' : `Free up ${formatBytes(stats.cacheSize)}`}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowClearAllDialog(true)}
                      className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="p-2.5 rounded-lg bg-destructive/10">
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">Clear All Data</p>
                        <p className="text-xs text-muted-foreground">Delete all messages, media, and settings</p>
                      </div>
                    </button>
                  </div>
                </motion.div>

                {/* Auto-download info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-4 bg-muted/50 rounded-xl"
                >
                  <h4 className="text-sm font-medium mb-2">💡 Save Data</h4>
                  <p className="text-xs text-muted-foreground">
                    Turn off auto-download in Settings to save mobile data and storage space.
                  </p>
                </motion.div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear All Data Confirmation */}
      <Dialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Clear All Data</DialogTitle>
            <DialogDescription>
              This will permanently delete all your messages, media files, and app settings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearAllDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAllData}
              disabled={isClearingAll}
            >
              {isClearingAll && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Copy, Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/features/auth/useAuth';
import { toast } from 'sonner';

interface QRCodeScreenProps {
  open: boolean;
  onClose: () => void;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Simple SVG QR code generator (mock)
function generateQRCode(data: string): string {
  // This is a placeholder - in production you'd use a real QR library
  const size = 200;
  const modules = 21; // QR code version 1
  const moduleSize = size / modules;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  
  // Generate pseudo-random pattern based on data
  const seed = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      // Position detection patterns (corners)
      const isPositionPattern = 
        (row < 7 && col < 7) || // Top-left
        (row < 7 && col >= modules - 7) || // Top-right
        (row >= modules - 7 && col < 7); // Bottom-left
      
      // Timing patterns
      const isTimingPattern = 
        (row === 6 && col >= 8 && col <= modules - 9) ||
        (col === 6 && row >= 8 && row <= modules - 9);
      
      // Calculate if module should be dark
      let isDark = false;
      
      if (isPositionPattern) {
        // Position detection patterns
        const cornerRow = row < 7 ? row : (row >= modules - 7 ? row - (modules - 7) : row);
        const cornerCol = col < 7 ? col : (col >= modules - 7 ? col - (modules - 7) : col);
        
        isDark = cornerRow === 0 || cornerRow === 6 || cornerCol === 0 || cornerCol === 6 ||
                 (cornerRow >= 2 && cornerRow <= 4 && cornerCol >= 2 && cornerCol <= 4);
      } else if (isTimingPattern) {
        isDark = (row + col) % 2 === 0;
      } else if (row >= 8 && col >= 8) {
        // Data area - pseudo-random based on seed
        isDark = ((seed * (row + 1) * (col + 1)) % 3) === 0;
      }
      
      if (isDark) {
        svg += `<rect x="${col * moduleSize}" y="${row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#000"/>`;
      }
    }
  }
  
  svg += '</svg>';
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function QRCodeScreen({ open, onClose }: QRCodeScreenProps) {
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);

  const profileUrl = `chatapp://user/${user?.id || 'user'}`;
  const qrCodeData = generateQRCode(profileUrl);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Chat with ${user?.name}`,
          text: `Add me on ChatApp!`,
          url: profileUrl,
        });
      } else {
        await handleCopyLink();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `chatapp-qr-${user?.name?.toLowerCase().replace(/\s+/g, '-') || 'user'}.svg`;
    link.href = qrCodeData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded!');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <DialogTitle className="text-base sm:text-lg">My QR Code</DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 flex flex-col items-center">
          {/* Profile Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-primary">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials(user?.name || 'User')}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-semibold">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </motion.div>

          {/* QR Code */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative bg-white p-4 rounded-2xl shadow-lg mb-6"
          >
            <img
              src={qrCodeData}
              alt="Profile QR Code"
              className="w-48 h-48 sm:w-56 sm:h-56"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white p-1 rounded-lg">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
            </div>
          </motion.div>

          {/* Instructions */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground text-center mb-6 max-w-xs"
          >
            Share this QR code with friends so they can add you instantly
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3 w-full max-w-xs"
          >
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              className="flex-1"
              onClick={handleShare}
              disabled={isSharing}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

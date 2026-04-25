import { useEffect, useRef, useState, useCallback, forwardRef } from 'react';
import { CallState, CallType, User } from '@/features/chat/types';
import { socketClient } from '@/features/chat/services/socketClient';
import { cn } from '@/lib/utils';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Loader2,
  Camera,
  CameraOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CallOverlayProps {
  callState: CallState;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  translate: (key: string) => string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const CallOverlay = forwardRef<HTMLDivElement, CallOverlayProps>(
  ({ callState, onEndCall, onToggleMute, onToggleVideo, translate }, ref) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Connect local stream to video element
    useEffect(() => {
      if (localVideoRef.current && callState.localStream) {
        localVideoRef.current.srcObject = callState.localStream;
      }
    }, [callState.localStream]);

    // Simulate remote video (mirror local for demo)
    useEffect(() => {
      if (remoteVideoRef.current && callState.localStream && callState.status === 'connected') {
        // In a real app, this would be the remote peer's stream
        // For demo, we mirror the local stream with a slight delay effect
        remoteVideoRef.current.srcObject = callState.localStream;
      }
    }, [callState.localStream, callState.status]);

    if (callState.status === 'idle' || callState.status === 'ended') {
      return null;
    }

    const isConnecting = callState.status === 'calling' || callState.status === 'connecting';
    const isVideo = callState.type === 'video';
    const isConnected = callState.status === 'connected';

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* Video area */}
        {isVideo ? (
          <div className="relative flex-1 bg-black">
            {/* Remote video (full screen) */}
            {isConnected && callState.localStream && !callState.isVideoOff ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-background">
                <div
                  className={cn(
                    'flex h-32 w-32 items-center justify-center rounded-full text-4xl font-bold',
                    isConnecting && 'animate-pulse',
                    'bg-primary text-primary-foreground'
                  )}
                >
                  {callState.remoteUser ? getInitials(callState.remoteUser.name) : '?'}
                </div>
              </div>
            )}

            {/* Local video (picture-in-picture) */}
            {isConnected && callState.localStream && !callState.isVideoOff && (
              <div className="absolute right-4 top-4 h-32 w-24 overflow-hidden rounded-xl border-2 border-border bg-black shadow-lg md:h-48 md:w-36">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full scale-x-[-1] object-cover"
                />
              </div>
            )}

            {/* User info overlay */}
            <div className="absolute left-4 top-4 flex items-center gap-3 rounded-xl bg-black/50 px-4 py-2 backdrop-blur-sm">
              <span className="font-medium text-white">
                {callState.remoteUser?.name || 'Unknown'}
              </span>
              {isConnected && (
                <span className="text-sm text-green-400">{formatDuration(callState.duration)}</span>
              )}
            </div>

            {/* Connecting state */}
            {isConnecting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="flex h-32 w-32 animate-pulse items-center justify-center rounded-full bg-primary/20">
                  <Video className="h-12 w-12 text-primary" />
                </div>
                <p className="mt-4 text-lg text-white">
                  {callState.status === 'calling'
                    ? translate('call.outgoing')
                    : translate('call.connecting')}
                </p>
                <div className="mt-4 flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-3 w-3 animate-bounce rounded-full bg-primary"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Audio call UI
          <div className="relative flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-8">
            <div
              className={cn(
                'flex h-32 w-32 items-center justify-center rounded-full text-4xl font-bold transition-all duration-500',
                isConnecting && 'animate-pulse',
                'bg-primary text-primary-foreground'
              )}
            >
              {callState.remoteUser ? getInitials(callState.remoteUser.name) : '?'}
            </div>

            <h2 className="mt-6 text-2xl font-semibold text-foreground">
              {callState.remoteUser?.name || 'Unknown'}
            </h2>

            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              {isConnecting && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {callState.status === 'calling'
                      ? translate('call.outgoing')
                      : translate('call.connecting')}
                  </span>
                </>
              )}
              {isConnected && (
                <span className="text-lg font-medium text-status-online">
                  {formatDuration(callState.duration)}
                </span>
              )}
            </div>

            {isConnecting && (
              <div className="mt-8 flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-3 w-3 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            )}

            {/* Audio visualization (simulated) */}
            {isConnected && (
              <div className="mt-8 flex items-end gap-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 animate-pulse rounded-full bg-primary"
                    style={{
                      height: `${Math.random() * 40 + 10}px`,
                      animationDelay: `${i * 100}ms`,
                      animationDuration: '0.5s',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 bg-card/80 p-6 backdrop-blur-sm md:p-8">
          {/* Mute button */}
          <Button
            variant="secondary"
            size="lg"
            className={cn(
              'h-14 w-14 rounded-full transition-all',
              callState.isMuted && 'bg-destructive/20 text-destructive hover:bg-destructive/30'
            )}
            onClick={onToggleMute}
          >
            {callState.isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {/* Video toggle (for video calls) */}
          {isVideo && (
            <Button
              variant="secondary"
              size="lg"
              className={cn(
                'h-14 w-14 rounded-full transition-all',
                callState.isVideoOff && 'bg-destructive/20 text-destructive hover:bg-destructive/30'
              )}
              onClick={onToggleVideo}
            >
              {callState.isVideoOff ? (
                <CameraOff className="h-6 w-6" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
            </Button>
          )}

          {/* End call button */}
          <Button
            variant="destructive"
            size="lg"
            className="h-14 w-14 rounded-full"
            onClick={onEndCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  }
);

CallOverlay.displayName = 'CallOverlay';

// Hook to manage call state with real media
export function useCall(translate: (key: string) => string) {
  const [callState, setCallState] = useState<CallState>({
    type: 'audio',
    status: 'idle',
    isMuted: false,
    isVideoOff: false,
    duration: 0,
  });

  const localStreamRef = useRef<MediaStream | null>(null);

  // Duration timer
  useEffect(() => {
    if (callState.status !== 'connected') return;

    const interval = setInterval(() => {
      setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);

    return () => clearInterval(interval);
  }, [callState.status]);

  // Cleanup media on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const requestMediaAccess = async (type: CallType): Promise<MediaStream | null> => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video' ? { facingMode: 'user', width: 1280, height: 720 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error(
          type === 'video'
            ? translate('error.cameraPermission')
            : translate('error.microphonePermission')
        );
      } else {
        toast.error(translate('error.generic'));
      }
      // removed console.error
      return null;
    }
  };

  const initiateCall = useCallback(
    async (type: CallType, remoteUser: User) => {
      // Request media access
      const stream = await requestMediaAccess(type);

      if (!stream) {
        return; // Permission denied or error
      }

      localStreamRef.current = stream;

      setCallState({
        type,
        status: 'calling',
        isMuted: false,
        isVideoOff: false,
        duration: 0,
        remoteUser,
        localStream: stream,
      });

      // BUG FIX #6: Use real socket signaling instead of setTimeout simulation
      try {
        // Import webrtcService at the top of the file
        const { default: webrtcService } = await import('@/features/chat/services/webrtcService');

        // Initiate real WebRTC call
        await webrtcService.initiateCall(remoteUser.id, type);

        // Also emit via socket for call signaling
        socketClient.initiateCall(remoteUser.id, type);

        // State transitions will happen via socket events (call:accepted, call:rejected, etc.)
        // These are handled in useChat.ts
      } catch (error) {
        console.error('Failed to initiate call:', error);
        toast.error('Failed to initiate call. Please try again.');
        endCallInternal();
      }
    },
    [translate]
  );

  const endCallInternal = useCallback(() => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setCallState((prev) => {
      const duration = prev.duration;
      if (duration > 0) {
        toast.info(`Call ended - ${formatDuration(duration)}`);
      }
      return { ...prev, status: 'ended', localStream: undefined };
    });

    setTimeout(() => {
      setCallState({
        type: 'audio',
        status: 'idle',
        isMuted: false,
        isVideoOff: false,
        duration: 0,
      });
    }, 2000);
  }, []);

  const endCall = useCallback(async () => {
    if (callState.remoteUser?.id) socketClient.endCall(callState.remoteUser.id);
    endCallInternal();
  }, [endCallInternal, callState.remoteUser?.id]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setCallState((prev) => ({ ...prev, isVideoOff: !prev.isVideoOff }));
  }, []);

  return {
    callState,
    initiateCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}

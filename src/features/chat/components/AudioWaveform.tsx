import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioWaveformProps {
  audioUrl: string;
  duration?: number;
  className?: string;
  compact?: boolean;
}

export function AudioWaveform({
  audioUrl,
  duration: initialDuration,
  className,
  compact,
}: AudioWaveformProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number | null>(null);

  // Generate waveform visualization
  useEffect(() => {
    const generateWaveform = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        )();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const rawData = audioBuffer.getChannelData(0);
        const samples = compact ? 20 : 40;
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
          const blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }

        // Normalize
        const multiplier = Math.max(...filteredData) > 0 ? 1 / Math.max(...filteredData) : 1;
        setWaveformData(filteredData.map((n) => n * multiplier));
        setDuration(audioBuffer.duration);

        audioContext.close();
      } catch (error) {
        // Generate random waveform if analysis fails
        const samples = compact ? 20 : 40;
        setWaveformData(Array.from({ length: samples }, () => Math.random() * 0.5 + 0.3));
      }
    };

    generateWaveform();
  }, [audioUrl, compact]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.5, 2, 0.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause button */}
      <motion.button
        onClick={togglePlay}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'flex items-center justify-center rounded-full transition-colors',
          compact
            ? 'h-8 w-8 bg-primary/10 hover:bg-primary/20'
            : 'h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90'
        )}
      >
        {isPlaying ? (
          <Pause className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
        ) : (
          <Play className={cn(compact ? 'h-4 w-4' : 'h-5 w-5', 'ml-0.5')} />
        )}
      </motion.button>

      {/* Waveform */}
      <div className="flex h-8 flex-1 cursor-pointer items-center gap-[2px]" onClick={handleSeek}>
        {waveformData.map((height, i) => {
          const barProgress = (i / waveformData.length) * 100;
          const isActive = barProgress < progress;

          return (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{
                scaleY: 1,
                backgroundColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
              }}
              transition={{ delay: i * 0.01 }}
              className="flex-1 origin-center rounded-full"
              style={{
                height: `${Math.max(height * 100, 20)}%`,
                minWidth: '2px',
                maxWidth: '4px',
              }}
            />
          );
        })}
      </div>

      {/* Time and controls */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="min-w-[40px] text-right">
          {formatTime(currentTime)}/{formatTime(duration)}
        </span>

        {!compact && (
          <button
            onClick={cyclePlaybackRate}
            className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium hover:bg-muted-foreground/20"
          >
            {playbackRate}x
          </button>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Mic, Square, Send, X, Trash2, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob) => void;
  onCancel: () => void;
  translate: (key: string) => string;
}

export function VoiceRecorder({ onSend, onCancel, translate }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>(Array(30).fill(0.3));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audioUrl]);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Sample 30 values from the frequency data
    const samples: number[] = [];
    const step = Math.floor(dataArray.length / 30);
    for (let i = 0; i < 30; i++) {
      const value = dataArray[i * step] / 255;
      samples.push(Math.max(value, 0.1));
    }
    
    setWaveformData(samples);
    animationRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis for waveform
      const audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      
      // Start waveform animation
      updateWaveform();
    } catch (error) {
      // removed console.error
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      updateWaveform();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
      resetRecorder();
    }
  };

  const resetRecorder = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    setWaveformData(Array(30).fill(0.3));
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Recorded audio preview
  if (audioBlob && audioUrl) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 bg-secondary rounded-2xl p-3"
      >
        <button
          onClick={resetRecorder}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors touch-target"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        
        <div className="flex-1">
          <audio src={audioUrl} controls className="w-full h-8" />
        </div>
        
        <span className="text-sm font-medium text-muted-foreground min-w-[40px]">
          {formatDuration(duration)}
        </span>
        
        <motion.button
          onClick={handleSend}
          whileTap={{ scale: 0.95 }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg touch-target"
        >
          <Send className="h-5 w-5" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-secondary rounded-2xl p-3"
    >
      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground/20 transition-colors touch-target"
      >
        <X className="h-5 w-5" />
      </button>
      
      <div className="flex-1 flex items-center gap-3">
        {/* Recording indicator and waveform */}
        <AnimatePresence>
          {isRecording && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 flex-1"
            >
              <div className="flex items-center gap-2">
                <motion.div 
                  animate={{ scale: isPaused ? 1 : [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className={cn(
                    "h-3 w-3 rounded-full",
                    isPaused ? "bg-warning" : "bg-destructive"
                  )} 
                />
                <span className={cn(
                  "text-sm font-medium",
                  isPaused ? "text-warning" : "text-destructive"
                )}>
                  {isPaused ? 'Paused' : 'Recording'}
                </span>
              </div>
              
              {/* Live waveform */}
              <div className="flex-1 flex items-center gap-[2px] h-8">
                {waveformData.map((height, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scaleY: isPaused ? 0.3 : height,
                    }}
                    transition={{ duration: 0.05 }}
                    className="flex-1 bg-primary rounded-full origin-center"
                    style={{
                      height: '100%',
                      minWidth: '2px',
                      maxWidth: '4px',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Duration */}
        <span className="text-sm font-medium text-muted-foreground min-w-[40px]">
          {formatDuration(duration)}
        </span>
      </div>
      
      {/* Pause/Resume button */}
      {isRecording && (
        <button
          onClick={isPaused ? resumeRecording : pauseRecording}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground/20 transition-colors touch-target"
        >
          {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </button>
      )}
      
      {/* Record/Stop button */}
      <motion.button
        onClick={isRecording ? stopRecording : startRecording}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full transition-all shadow-lg touch-target',
          isRecording
            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
      >
        {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </motion.button>
    </motion.div>
  );
}

/**
 * Voice Message Recording Service
 * Uses Web Audio API to record audio messages
 */

export interface VoiceRecording {
  blob: Blob;
  duration: number;
  url: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
}

class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private pauseStartTime: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;

  private stateListeners: Set<(state: RecordingState) => void> = new Set();

  private state: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null,
  };

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    try {
      // Request microphone permission
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });

      // Create MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      // Reset chunks
      this.audioChunks = [];
      this.startTime = Date.now();
      this.pausedDuration = 0;

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Handle recording stopped
      this.mediaRecorder.onstop = () => {
        this.stopTimer();
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms

      // Update state
      this.updateState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        error: null,
      });

      // Start timer
      this.startTimer();

      console.log('Voice recording started', { mimeType });
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      this.updateState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        error: error.message || 'Microphone access denied',
      });
      throw error;
    }
  }

  /**
   * Stop recording and return the audio blob
   */
  async stopRecording(): Promise<VoiceRecording> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.state.isRecording === false) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          // Create blob from chunks
          const mimeType = this.getSupportedMimeType();
          const blob = new Blob(this.audioChunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const duration = this.getCurrentDuration();

          // Cleanup
          this.cleanup();

          // Update state
          this.updateState({
            isRecording: false,
            isPaused: false,
            duration: 0,
            error: null,
          });

          resolve({ blob, duration, url });
        } catch (error: any) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (!this.mediaRecorder || this.state.isRecording === false) return;

    if (this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.pauseStartTime = Date.now();
      this.stopTimer();

      this.updateState({
        ...this.state,
        isPaused: true,
      });

      console.log('Recording paused');
    }
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (!this.mediaRecorder || this.state.isRecording === false) return;

    if (this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.pausedDuration += Date.now() - this.pauseStartTime;
      this.startTimer();

      this.updateState({
        ...this.state,
        isPaused: false,
      });

      console.log('Recording resumed');
    }
  }

  /**
   * Cancel recording without saving
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.state.isRecording) {
      this.mediaRecorder.stop();
      this.cleanup();

      this.updateState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        error: null,
      });

      console.log('Recording cancelled');
    }
  }

  /**
   * Get current recording duration in seconds
   */
  getCurrentDuration(): number {
    if (!this.state.isRecording) return 0;
    const elapsed = Date.now() - this.startTime - this.pausedDuration;
    return Math.floor(elapsed / 1000);
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: (state: RecordingState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Get current state
   */
  getState(): RecordingState {
    return { ...this.state };
  }

  /**
   * Check if recording is active
   */
  isRecording(): boolean {
    return this.state.isRecording;
  }

  /**
   * Get supported MIME type for audio recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Start duration timer
   */
  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      const duration = this.getCurrentDuration();
      this.updateState({
        ...this.state,
        duration,
      });

      // Auto-stop after 10 minutes
      if (duration >= 600) {
        this.stopRecording().catch(console.error);
      }
    }, 1000);
  }

  /**
   * Stop duration timer
   */
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.stopTimer();

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.startTime = 0;
    this.pausedDuration = 0;
    this.pauseStartTime = 0;
  }

  /**
   * Update state and notify listeners
   */
  private updateState(newState: RecordingState): void {
    this.state = newState;
    this.stateListeners.forEach((listener) => listener(newState));
  }

  /**
   * Format duration as MM:SS
   */
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

export const voiceRecorder = new VoiceRecorder();
export default voiceRecorder;

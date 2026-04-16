/**
 * WebRTC Service - FREE Audio/Video Calls
 * Uses only FREE STUN servers (no paid TURN)
 * Works for 80-90% of users via direct peer-to-peer connection
 */

import { socketClient } from './socketClient';

const webrtcConfig: RTCConfiguration = {
  iceServers: [
    // Google's free STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Additional free STUN servers
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all',
};

export interface CallState {
  isActive: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  remoteUserId: string | null;
  callType: 'audio' | 'video' | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callState: CallState = {
    isActive: false,
    isMuted: false,
    isVideoOff: false,
    remoteUserId: null,
    callType: null,
    localStream: null,
    remoteStream: null,
  };

  /**
   * Initialize WebRTC call
   */
  async initiateCall(remoteUserId: string, callType: 'audio' | 'video'): Promise<void> {
    try {
      // Get user media
      this.localStream = await this.getUserMedia(callType);
      
      // Create peer connection
      this.peerConnection = new RTCPeerConnection(webrtcConfig);
      
      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
      
      // Set up event handlers
      this.setupPeerConnectionEvents();
      
      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      // Send offer via Socket.IO signaling
      // TODO: Implement full WebRTC signaling with SDP exchange
      socketClient.initiateCall(remoteUserId, callType);
      
      // Update state
      this.callState = {
        ...this.callState,
        isActive: true,
        remoteUserId,
        callType,
        localStream: this.localStream,
      };
    } catch (error) {
      console.error('Failed to initiate call:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Accept incoming call
   */
  async acceptCall(fromUserId: string, callType: 'audio' | 'video'): Promise<void> {
    try {
      // Get user media
      this.localStream = await this.getUserMedia(callType);
      
      // Create peer connection
      this.peerConnection = new RTCPeerConnection(webrtcConfig);
      
      // Add local stream
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
      
      // Set up event handlers
      this.setupPeerConnectionEvents();
      
      // Send accept via Socket.IO
      // TODO: Implement full WebRTC signaling with SDP exchange
      socketClient.acceptCall(fromUserId);
      
      // Update state
      this.callState = {
        ...this.callState,
        isActive: true,
        remoteUserId: fromUserId,
        callType,
        localStream: this.localStream,
      };
    } catch (error) {
      console.error('Failed to accept call:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Handle incoming answer (TODO: Implement full signaling)
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      console.error('No peer connection to handle answer');
      return;
    }
    
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  }

  /**
   * Handle ICE candidate (TODO: Implement full signaling)
   */
  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  /**
   * End call
   */
  endCall(): void {
    if (this.callState.remoteUserId) {
      socketClient.endCall(this.callState.remoteUserId);
    }
    this.cleanup();
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    if (!this.localStream) return;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.callState.isMuted = !audioTrack.enabled;
    }
  }

  /**
   * Toggle video
   */
  toggleVideo(): void {
    if (!this.localStream) return;
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.callState.isVideoOff = !videoTrack.enabled;
    }
  }

  /**
   * Get user media (camera/microphone)
   */
  private async getUserMedia(callType: 'audio' | 'video'): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: callType === 'video' ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
        facingMode: 'user',
      } : false,
    };
    
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw new Error('Camera/microphone access denied');
    }
  }

  /**
   * Set up peer connection event handlers
   */
  private setupPeerConnectionEvents(): void {
    if (!this.peerConnection) return;
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callState.remoteUserId) {
        // TODO: Implement ICE candidate signaling via Socket.IO
        console.log('ICE candidate generated:', event.candidate);
      }
    };
    
    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      this.remoteStream = event.streams[0];
      this.callState.remoteStream = this.remoteStream;
      
      // Emit event for UI to update
      window.dispatchEvent(new CustomEvent('webrtc:remoteStream', {
        detail: { stream: this.remoteStream }
      }));
    };
    
    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      
      if (this.peerConnection?.connectionState === 'disconnected' ||
          this.peerConnection?.connectionState === 'failed') {
        this.cleanup();
      }
    };
    
    // Handle ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection?.iceConnectionState);
    };
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Reset state
    this.callState = {
      isActive: false,
      isMuted: false,
      isVideoOff: false,
      remoteUserId: null,
      callType: null,
      localStream: null,
      remoteStream: null,
    };
    
    // Emit cleanup event
    window.dispatchEvent(new CustomEvent('webrtc:callEnded'));
  }

  /**
   * Get current call state
   */
  getCallState(): CallState {
    return { ...this.callState };
  }

  /**
   * Check if call is active
   */
  isCallActive(): boolean {
    return this.callState.isActive;
  }
}

export default new WebRTCService();

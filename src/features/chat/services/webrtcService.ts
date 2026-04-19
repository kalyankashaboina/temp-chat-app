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
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Set up event handlers
      this.setupPeerConnectionEvents();

      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Send offer via Socket.IO signaling with SDP
      socketClient.initiateCall(remoteUserId, callType);

      // Send SDP offer for WebRTC connection
      socketClient.sendWebRTCOffer(remoteUserId, offer);

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
  async acceptCall(
    fromUserId: string,
    callType: 'audio' | 'video',
    offer?: RTCSessionDescriptionInit
  ): Promise<void> {
    try {
      // Get user media
      this.localStream = await this.getUserMedia(callType);

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(webrtcConfig);

      // Add local stream
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Set up event handlers
      this.setupPeerConnectionEvents();

      // If we have the offer, set it as remote description and create answer
      if (offer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        // Send answer back to caller
        socketClient.sendWebRTCAnswer(fromUserId, answer);
      }

      // Send accept via Socket.IO
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
      video:
        callType === 'video'
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
              facingMode: 'user',
            }
          : false,
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
        // Send ICE candidate via Socket.IO for NAT traversal
        socketClient.sendICECandidate(this.callState.remoteUserId, event.candidate.toJSON());
        console.log('ICE candidate sent to peer');
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      this.remoteStream = event.streams[0];
      this.callState.remoteStream = this.remoteStream;

      // Emit event for UI to update
      window.dispatchEvent(
        new CustomEvent('webrtc:remoteStream', {
          detail: { stream: this.remoteStream },
        })
      );
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);

      if (
        this.peerConnection?.connectionState === 'disconnected' ||
        this.peerConnection?.connectionState === 'failed'
      ) {
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
      this.localStream.getTracks().forEach((track) => track.stop());
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

  /**
   * Setup WebRTC signaling event listeners
   * Call this after socket connection is established
   */
  setupWebRTCListeners(): void {
    // Listen for incoming SDP offer
    socketClient.on('webrtc:offer', async (event) => {
      const { fromUserId, offer } = event.payload as {
        fromUserId: string;
        offer: RTCSessionDescriptionInit;
      };
      console.log('Received WebRTC offer from:', fromUserId);

      if (!this.peerConnection) {
        console.error('No peer connection to handle offer');
        return;
      }

      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        // Send answer back
        socketClient.sendWebRTCAnswer(fromUserId, answer);
        console.log('Sent WebRTC answer to:', fromUserId);
      } catch (error) {
        console.error('Failed to handle WebRTC offer:', error);
      }
    });

    // Listen for incoming SDP answer
    socketClient.on('webrtc:answer', async (event) => {
      const { fromUserId, answer } = event.payload as {
        fromUserId: string;
        answer: RTCSessionDescriptionInit;
      };
      console.log('Received WebRTC answer from:', fromUserId);

      if (!this.peerConnection) {
        console.error('No peer connection to handle answer');
        return;
      }

      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Set remote description successfully');
      } catch (error) {
        console.error('Failed to handle WebRTC answer:', error);
      }
    });

    // Listen for ICE candidates
    socketClient.on('webrtc:ice', async (event) => {
      const { fromUserId, candidate } = event.payload as {
        fromUserId: string;
        candidate: RTCIceCandidateInit;
      };
      console.log('Received ICE candidate from:', fromUserId);

      if (!this.peerConnection) {
        console.error('No peer connection to add ICE candidate');
        return;
      }

      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('Added ICE candidate successfully');
      } catch (error) {
        console.error('Failed to add ICE candidate:', error);
      }
    });

    console.log('WebRTC signaling listeners setup complete');
  }
}

export default new WebRTCService();

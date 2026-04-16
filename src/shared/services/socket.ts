import { socketClient } from '@/features/chat/services/socketClient';

export const socketService = socketClient;

export function disconnectSocket() {
  socketClient.disconnect();
}

export function connectSocket() {
  socketClient.connect();
}

export function getSocket() {
  return socketClient;
}

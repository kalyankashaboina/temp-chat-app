// Legacy re-exports kept for component compatibility.
// All real auth goes through authService.ts + authSlice.ts

export async function mockEndCall(): Promise<void> {
  // Real call end is handled via socket in CallOverlay
  return Promise.resolve();
}

export interface CallResult {
  success: boolean;
  error?: string;
}

export function mockTypingIndicator(
  _onStart: () => void,
  _onEnd: () => void,
): () => void {
  return () => {};
}

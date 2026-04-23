# Changelog - Relay Chat Frontend

## [Upcoming Release]

### 🔮 Planned Features

**Progressive Web App (PWA) Enhancement**
- Full Progressive Web App (PWA) support with native-like capabilities across iOS and Android, including offline access, installability, and performance optimizations.

---

## [1.1.0] - 2026-04-21

### 🐛 Bug Fixes (8/8 Complete)

1. **Bug #5 (HIGH)** - Fixed message loss on conversation switch
   - Changed `fetchMessages.fulfilled` from replace to merge strategy
   - Preserves socket-delivered messages when HTTP fetch returns
   - Location: `src/features/chat/chatSlice.ts`

2. **Bug #6 (CRITICAL)** - Fixed call event handling
   - Removed all `setTimeout` simulation code
   - Added real socket listeners for all call events
   - CallOverlay uses real WebRTC calls
   - Locations: `src/features/chat/useChat.ts`, `src/features/chat/components/CallOverlay.tsx`

3. **Bug #7 (CRITICAL)** - WebRTC listeners initialized
   - Added `webrtcService.setupWebRTCListeners()` call after socket connect
   - Location: `src/App.tsx`

4. **Bug #8 (MEDIUM)** - Fixed duplicate typing listeners
   - Removed duplicate listeners from ConversationList
   - Changed typingUsers to per-conversation Record
   - Locations: `src/features/chat/chatSlice.ts`, `src/features/chat/useChat.ts`

5. **Bug #9 (MEDIUM)** - Connection status monitoring
   - Added `onConnectionChange()` method to socketClient
   - Location: `src/features/chat/services/socketClient.ts`

6. **Bug #10 (MEDIUM)** - lastMessage always updates
   - Fixed to update regardless of active conversation
   - Location: `src/features/chat/chatSlice.ts`

7. **Bug #11 (MEDIUM)** - Pending message timeout
   - Added 10-second auto-fail timeout
   - Location: `src/features/chat/chatSlice.ts`

8. **Bug #12 (LOW-MEDIUM)** - Retry searches all conversations
   - No longer limited to active conversation
   - Location: `src/features/chat/chatSlice.ts`

### ✨ New Features

- **Axios API Client**: Centralized HTTP client with interceptors
- **Per-conversation typing state**: Improved typing indicators
- **Connection monitoring**: Real-time connection status

### 🔧 Improvements

- TypeScript: All type errors resolved
- Socket Events: Added `message:confirmed` event
- Code Quality: Removed orphan event types
- Error Handling: Comprehensive error handling throughout

### 🧪 Testing

- ✅ TypeScript type-check: PASSING
- ✅ ESLint: PASSING (0 errors)
- ✅ Build: SUCCESS

---

## [1.0.0] - 2026-04-15

### Initial Release

- Real-time messaging
- WebRTC video/audio calling
- Group chats
- File uploads
- Message reactions
- Typing indicators
- Read receipts
- Dark/Light theme
- PWA support

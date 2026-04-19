# Relay Chat - Frontend

Modern real-time messaging frontend built with React, TypeScript, TailwindCSS, and Socket.IO.

## 🚀 Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Set up environment
cp .env.example .env
# Edit .env with your API URL

# Run development server
npm run dev

# App starts on http://localhost:5173
```

## 📋 Prerequisites

- Node.js 20.x+
- Backend API running

## ⚙️ Environment Variables

```env
VITE_API_BASE_URL=http://localhost:4000
```

## 📝 Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier
- `npm run type-check` - TypeScript check

## 🐳 Docker

```bash
# Build Docker image
docker build -t relay-chat-frontend \
  --build-arg VITE_API_BASE_URL=https://api.yoursite.com .

# Run container
docker run -p 3000:8080 relay-chat-frontend

# Full stack from root
cd .. && docker-compose up
```

## 🎨 Key Features

✅ Real-time messaging UI
✅ WebRTC video/audio calls
✅ Voice message recording (Web Audio API)
✅ File upload with progress tracking
✅ Image compression
✅ Infinite scroll for messages
✅ Message search
✅ Typing indicators
✅ Read receipts
✅ Group chat management
✅ Dark/light themes
✅ PWA support

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **Socket.IO Client** for real-time
- **Shadcn/ui** for components
- **Redux Toolkit** for state
- **React Router** for routing

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── features/            # Feature modules
│   │   ├── auth/            # Authentication
│   │   ├── chat/            # Chat & messaging
│   │   │   └── services/    # WebRTC, voice, file upload
│   │   ├── notifications/   # Notifications
│   │   └── settings/        # User settings
│   ├── shared/              # Shared utilities
│   │   └── hooks/           # Custom React hooks
│   ├── store/               # Redux store
│   └── pages/               # Page components
├── .github/workflows/       # CI/CD pipelines
├── Dockerfile               # Docker configuration
└── package.json
```

## 🎯 New Services (v1.1.0)

### Voice Recording
```typescript
import voiceRecorder from '@/features/chat/services/voiceRecorder';

await voiceRecorder.startRecording();
const { blob, duration } = await voiceRecorder.stopRecording();
```

### File Upload
```typescript
import { uploadFile } from '@/features/chat/services/fileUpload';

const result = await uploadFile(file, {
  onProgress: (p) => console.log(`${p.percentage}%`)
});
```

### Infinite Scroll
```tsx
const { scrollRef } = useMessageScroll({
  onLoadMore: loadOlderMessages,
  hasMore: true
});

return <div ref={scrollRef}>{messages}</div>;
```

### WebRTC
```typescript
import webrtcService from '@/features/chat/services/webrtcService';

await webrtcService.initiateCall(userId, 'video');
```

## 📊 CI/CD

GitHub Actions configured:
- **CI**: Lint, type-check, build
- **CD**: Auto-deploy to Vercel on push to main

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Deploy dist/ folder
```

### Docker
```bash
docker build -t relay-chat-frontend \
  --build-arg VITE_API_BASE_URL=https://api.yoursite.com .
docker run -p 3000:8080 relay-chat-frontend
```

## 🔧 Build Configuration

The app uses Vite with:
- React SWC for fast refresh
- TailwindCSS for styling
- PWA plugin for offline support
- Path aliases (`@/` → `src/`)

## 📄 License

ISC

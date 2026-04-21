# 🎨 Relay Chat - Frontend

![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue)
![Status](https://img.shields.io/badge/status-production--ready-green)

Modern, real-time chat application frontend built with React 18, TypeScript, Redux Toolkit, Socket.IO, and WebRTC.

---

## ✨ Features

- 🔄 Real-time messaging via WebSocket
- 📹 Video/audio calling with WebRTC
- 💬 Typing indicators & read receipts
- 😀 Message reactions
- 👥 Group chats
- 📎 File uploads
- 🌓 Dark/Light theme
- 📱 Mobile responsive
- ⚡ PWA support

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Edit .env with your backend URL

# Start development server
npm run dev
```

Access at: `http://localhost:5173`

---

## 📋 Prerequisites

- Node.js v18+
- Backend API running (see backend repository)

---

## ⚙️ Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_APP_NAME=Relay Chat
VITE_APP_VERSION=1.1.0
```

---

## 📜 Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

---

## 🛠 Tech Stack

- React 18 + TypeScript
- Redux Toolkit
- Socket.IO Client
- WebRTC
- Tailwind CSS + shadcn/ui
- Framer Motion
- React Router
- Axios

---

## 📁 Structure

```
src/
├── features/         # Feature modules (auth, chat, settings)
├── components/       # Shared UI components
├── shared/          # Utils, hooks, constants
├── store/           # Redux store
├── config/          # Configuration
└── App.tsx          # Root component
```

---

## 🚀 Deployment

### Build

```bash
npm run build
```

### Deploy to

- **Vercel** (recommended): `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **Cloudflare Pages**: Connect GitHub repo

---

## 🔌 Socket Events

**Listening:** presence:init, user:online, user:offline, message:new, message:sent, message:confirmed, message:delivered, message:read, typing:start, typing:stop, call:incoming, call:accepted, webrtc:offer, etc.

**Emitting:** message:send, typing:start, typing:stop, call:initiate, call:accept, webrtc:offer, etc.

See full list in `/src/config/index.ts`

---

## 🐛 Troubleshooting

**Install fails:** Use `npm install --legacy-peer-deps`

**WebSocket fails:** Check `VITE_API_BASE_URL` and backend CORS

**Build fails:** Run `npm run type-check` to see errors

---

## 📝 License

MIT License

---

**Built with ❤️ using React, TypeScript, and WebRTC**

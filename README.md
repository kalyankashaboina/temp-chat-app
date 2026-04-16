# 🎨 Relay Chat Frontend

Modern React chat application with real-time messaging and beautiful UI.

## 🎯 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Access: http://localhost:5173

## 📦 Prerequisites

- Node.js 20+
- Backend running on http://localhost:4000

## 🌐 Environment (.env)

```bash
VITE_API_URL=http://localhost:4000
```

## 🔧 Scripts

```bash
npm run dev          # Development server with HMR
npm run build        # Production build
npm run preview      # Preview production build
npm run type-check   # TypeScript check
npm run lint         # ESLint
npm run test:e2e     # Playwright E2E tests
```

## 🧪 Testing

### E2E Tests (Playwright)

```bash
# Install Playwright browsers
npx playwright install chromium

# Run tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui
```

## 🎨 Tech Stack

- React 18
- TypeScript
- Vite
- TailwindCSS
- RTK Query
- Socket.IO Client
- React Router
- Shadcn/ui components

## ✅ Features

- Real-time messaging
- Typing indicators
- Read receipts
- Message reactions
- Voice/Video calls (WebRTC)
- File uploads
- Dark/Light theme
- Responsive design
- PWA support
- Error boundaries

## 📁 Structure

```
frontend/
├── src/
│   ├── components/       # Shared components
│   ├── features/
│   │   ├── auth/        # Authentication
│   │   ├── chat/        # Chat features
│   │   └── api/         # RTK Query
│   ├── App.tsx
│   └── main.tsx
├── public/
└── package.json
```

## 🚀 Build for Production

```bash
npm run build
```

Output: `dist/` (1.3MB bundle, 134KB gzipped)

## 🐳 Docker Production

```bash
docker build -t relay-chat-frontend .
docker run -p 8080:8080 relay-chat-frontend
```

---

**Frontend for Relay Chat**

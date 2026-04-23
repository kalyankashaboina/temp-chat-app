import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initDebugUtils } from '@/shared/services/debugUtils';

// Initialize debug utilities for console access
if (import.meta.env.DEV) {
  initDebugUtils();
}

createRoot(document.getElementById('root')!).render(<App />);

#!/usr/bin/env bash

set -e  # stop on first error

echo "======================================"
echo "🚀 LOCAL CI CHECK STARTED"
echo "======================================"

echo ""
echo "📦 Installing dependencies..."
npm ci

echo ""
echo "🔍 Running ESLint..."
npm run lint

echo ""
echo "🎨 Checking Prettier formatting..."
npm run format:check

echo ""
echo "🧠 Running TypeScript type check..."
npm run type-check

echo ""
echo "🏗️ Building project..."
VITE_API_BASE_URL=https://api.example.com npm run build

echo ""
echo "📦 Checking bundle size..."
du -sh dist/ || echo "dist folder missing"
du -sh dist/assets/ || echo "assets folder missing"

echo ""
echo "✅ ALL CHECKS PASSED"
echo "======================================"
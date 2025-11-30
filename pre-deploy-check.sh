#!/bin/bash

# ShadowTalk - Quick Deployment Checklist
# Run this before deploying to catch common issues

echo "🔍 ShadowTalk Pre-Deployment Checklist"
echo "========================================"
echo ""

# Check if in project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this from the ShadowTalk project root"
    exit 1
fi

echo "✅ Project structure found"
echo ""

# Backend checks
echo "📦 Backend Checks:"
echo "-----------------"

cd backend

# Check package.json
if [ ! -f "package.json" ]; then
    echo "❌ backend/package.json not found"
    exit 1
fi
echo "✅ package.json exists"

# Check for .env.example
if [ ! -f ".env.example" ]; then
    echo "⚠️  .env.example not found"
else
    echo "✅ .env.example exists"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Run: cd backend && npm install"
else
    echo "✅ Dependencies installed"
fi

# Check critical files
if [ ! -f "server.js" ]; then
    echo "❌ server.js not found"
    exit 1
fi
echo "✅ server.js exists"

cd ..

# Frontend checks
echo ""
echo "🎨 Frontend Checks:"
echo "------------------"

cd frontend

# Check package.json
if [ ! -f "package.json" ]; then
    echo "❌ frontend/package.json not found"
    exit 1
fi
echo "✅ package.json exists"

# Check for .env.example
if [ ! -f ".env.example" ]; then
    echo "⚠️  .env.example not found"
else
    echo "✅ .env.example exists"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Run: cd frontend && npm install"
else
    echo "✅ Dependencies installed"
fi

# Check vite.config.js
if [ ! -f "vite.config.js" ]; then
    echo "❌ vite.config.js not found"
    exit 1
fi
echo "✅ vite.config.js exists"

cd ..

# Git checks
echo ""
echo "🔧 Git Checks:"
echo "-------------"

if [ ! -d ".git" ]; then
    echo "⚠️  Git not initialized"
    echo "   Run: git init"
else
    echo "✅ Git initialized"
    
    # Check if remote exists
    if git remote -v | grep -q "origin"; then
        echo "✅ Git remote configured"
        REMOTE_URL=$(git remote get-url origin)
        echo "   Remote: $REMOTE_URL"
    else
        echo "⚠️  No git remote configured"
        echo "   Add remote: git remote add origin <your-repo-url>"
    fi
fi

# Environment variables reminder
echo ""
echo "🔐 Environment Variables Reminder:"
echo "---------------------------------"
echo ""
echo "Backend (.env):"
echo "  - NODE_ENV=production"
echo "  - MONGODB_URI=<your-mongodb-atlas-url>"
echo "  - JWT_SECRET=<32-char-random-string>"
echo "  - CORS_ORIGIN=<your-vercel-url>"
echo ""
echo "Frontend (.env.production):"
echo "  - VITE_API_URL=<your-render-url>"
echo "  - VITE_SOCKET_URL=<your-render-url>"
echo ""

# Summary
echo ""
echo "📋 Deployment Summary:"
echo "---------------------"
echo ""
echo "1. Set up MongoDB Atlas"
echo "   → https://www.mongodb.com/cloud/atlas"
echo ""
echo "2. Deploy Backend to Render"
echo "   → See: RENDER_DEPLOYMENT.md"
echo "   → Set environment variables"
echo "   → Get backend URL"
echo ""
echo "3. Deploy Frontend to Vercel"
echo "   → See: VERCEL_DEPLOYMENT.md"
echo "   → Set VITE_API_URL to Render URL"
echo "   → Get frontend URL"
echo ""
echo "4. Update CORS on Render"
echo "   → Set CORS_ORIGIN to Vercel URL"
echo ""
echo "5. Test Production"
echo "   → Create session"
echo "   → Send messages"
echo "   → Test real-time features"
echo ""
echo "✨ Good luck with your deployment!"
echo ""

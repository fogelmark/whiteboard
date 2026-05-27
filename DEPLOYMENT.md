# Deployment Guide

## Overview
This whiteboard app has two parts:
1. **Next.js frontend** → Deploy to Vercel
2. **WebSocket server** → Deploy to Railway

## Deploy WebSocket Server to Railway

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose this repository
   - Railway will detect the `server` folder

3. **Configure the service**
   - Railway should auto-detect the Node.js app
   - Set root directory to `server`
   - Railway will automatically use `npm start` command
   - A public URL will be generated (e.g., `your-app.railway.app`)

4. **Get your WebSocket URL**
   - Copy the Railway public URL
   - Your WebSocket URL will be: `wss://your-app.railway.app`

## Deploy Frontend to Vercel

1. **Push to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Add Railway server setup"
   git push
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variable**
   - In Vercel project settings → Environment Variables
   - Add: `NEXT_PUBLIC_WS_URL` = `wss://your-app.railway.app`
   - Redeploy

## Local Development (Optional - for testing on your computer only)

**Important:** `localhost` only works on YOUR computer. It's not a public URL and cannot be accessed by others. This is safe and only for local testing.

1. **Start WebSocket server**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Start Next.js app** (in a new terminal)
   ```bash
   npm run dev
   ```

3. **Test locally**
   - Open http://localhost:3000 in your browser
   - This ONLY works on your computer - nobody else can access it
   - WebSocket connects to ws://localhost:3001

## Production Testing

After deploying to Vercel + Railway:
- Share your Vercel URL (e.g., `https://your-app.vercel.app`)
- Open on multiple devices/browsers
- You should see drawings sync in real-time

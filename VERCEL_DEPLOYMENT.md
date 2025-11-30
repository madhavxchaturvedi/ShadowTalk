# 🚀 Vercel Frontend Deployment Guide

## Prerequisites
- GitHub account with ShadowTalk repo pushed
- Vercel account (free tier)
- Backend deployed on Render (get the URL first!)

---

## Step 1: Prepare Frontend for Production

### 1.1 Update Environment Variables

Create production environment file:

```bash
cd /Users/madhavchaturvedi/SDE/Projects/ShadowTalk/frontend
```

Create `.env.production`:
```env
VITE_API_URL=https://shadowtalk-backend.onrender.com
VITE_SOCKET_URL=https://shadowtalk-backend.onrender.com
```

**Replace** `shadowtalk-backend.onrender.com` with your **actual Render URL**!

### 1.2 Test Production Build Locally

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` - should work!

### 1.3 Commit Changes

```bash
git add .
git commit -m "Add production environment config"
git push origin main
```

---

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Easiest)

#### 2.1 Sign Up / Login

1. Go to [Vercel](https://vercel.com)
2. Click **"Sign Up"** or **"Login"**
3. Connect with **GitHub**

#### 2.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Find **ShadowTalk** repository
3. Click **"Import"**

#### 2.3 Configure Project

**Framework Preset:**
- Vercel auto-detects: **Vite** ✅

**Root Directory:**
- Click **"Edit"**
- Set to: `frontend`

**Build Settings:**
- Build Command: `npm run build` (auto-filled)
- Output Directory: `dist` (auto-filled)
- Install Command: `npm install` (auto-filled)

#### 2.4 Environment Variables

Click **"Environment Variables"**

Add these 2 variables:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://shadowtalk-backend.onrender.com` |
| `VITE_SOCKET_URL` | `https://shadowtalk-backend.onrender.com` |

**Important:** Replace with your **actual Render backend URL**!

#### 2.5 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. You'll get a URL like: `https://shadowtalk-frontend.vercel.app`

---

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from frontend directory
cd frontend
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Scope: Your account
# - Link to existing project? N
# - Project name: shadowtalk-frontend
# - Directory: ./ (current)
# - Override settings? N

# Deploy to production
vercel --prod
```

Add environment variables via CLI:
```bash
vercel env add VITE_API_URL production
# Enter: https://shadowtalk-backend.onrender.com

vercel env add VITE_SOCKET_URL production
# Enter: https://shadowtalk-backend.onrender.com

# Redeploy with new env vars
vercel --prod
```

---

## Step 3: Update Backend CORS

**Critical Step!** Update Render backend to allow your Vercel domain:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your **shadowtalk-backend** service
3. Go to **Environment** tab
4. Update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://shadowtalk-frontend.vercel.app
   ```
   (Replace with your actual Vercel URL)
5. Click **"Save Changes"**
6. Wait for auto-redeploy (~2 min)

---

## Step 4: Test Production Deployment

### 4.1 Visit Your Site

Open: `https://shadowtalk-frontend.vercel.app`

### 4.2 Test Checklist

- [ ] ✅ Page loads (no white screen)
- [ ] ✅ Click "Join as Anonymous" - creates session
- [ ] ✅ See rooms list
- [ ] ✅ Create new room
- [ ] ✅ Send message in room
- [ ] ✅ Open in 2 tabs - see real-time messages
- [ ] ✅ Test DMs
- [ ] ✅ Test blocking
- [ ] ✅ Test reporting
- [ ] ✅ No console errors in DevTools

### 4.3 Check Browser Console

Press `F12` → Console tab

**Should NOT see:**
- ❌ CORS errors
- ❌ Failed to fetch errors
- ❌ WebSocket connection failed

**Should see:**
- ✅ Socket connected
- ✅ User registered for DMs

---

## 🔧 Vercel Configuration

### Auto-Deploy from GitHub

Vercel automatically deploys on push to `main`:

```bash
# Make changes
git add .
git commit -m "Add feature"
git push

# Vercel auto-deploys in 1-2 minutes
```

### Custom Domain (Optional)

1. Dashboard → Project → Settings → **Domains**
2. Add your domain: `shadowtalk.com`
3. Update DNS records (Vercel provides instructions)
4. Update `CORS_ORIGIN` on Render to new domain

### Preview Deployments

Every pull request gets a preview URL:
- Test features before merging
- Share with team for review

---

## 🐛 Troubleshooting

### Build Failed

**Check `package.json` scripts:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Check Node version:**
Add `vercel.json` in frontend folder:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

### CORS Errors

**Symptoms:**
- Console error: "has been blocked by CORS policy"
- API requests fail

**Fix:**
1. Check `CORS_ORIGIN` on Render matches Vercel URL exactly
2. No trailing slash: ❌ `https://app.vercel.app/` ✅ `https://app.vercel.app`
3. Must be HTTPS
4. Wait for Render redeploy after changing

### Socket.io Not Connecting

**Symptoms:**
- Real-time features don't work
- Console: "WebSocket connection failed"

**Fix:**
1. Verify `VITE_SOCKET_URL` is set correctly
2. Check Render logs for WebSocket errors
3. Ensure backend is running (not sleeping)
4. Test: `curl https://your-backend.onrender.com/health`

### Environment Variables Not Working

**Symptoms:**
- Using localhost URLs in production
- API calls to wrong domain

**Fix:**
1. Vercel Dashboard → Project → Settings → **Environment Variables**
2. Ensure `VITE_` prefix on all vars
3. Redeploy after adding vars:
   ```bash
   vercel --prod --force
   ```

### White Screen / Blank Page

**Possible Causes:**
1. Build error (check Vercel build logs)
2. JavaScript error (check browser console)
3. Wrong output directory

**Fix:**
1. Test locally: `npm run build && npm run preview`
2. Check Vercel build logs for errors
3. Ensure `outputDirectory` is `dist`

---

## 📊 Performance & Analytics

### Vercel Analytics

Enable free analytics:

1. Dashboard → Project → **Analytics** tab
2. Enable **Web Analytics**
3. See real user metrics:
   - Page views
   - Load times
   - Performance scores

### Speed Insights

1. Dashboard → Project → **Speed Insights**
2. Get Core Web Vitals data
3. Optimize based on recommendations

---

## 🔐 Security Headers

Vercel automatically adds:
- ✅ HTTPS/SSL
- ✅ Security headers
- ✅ DDoS protection
- ✅ Edge caching

---

## 🎯 Your Frontend URLs

After deployment:

```
Production: https://shadowtalk-frontend.vercel.app
Preview: https://shadowtalk-frontend-git-main-yourname.vercel.app
Development: http://localhost:5173
```

---

## 💰 Cost

**Free Tier (Hobby):**
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS
- **Perfect for ShadowTalk!**

**Pro ($20/month):**
- More bandwidth
- Team features
- Better analytics
- Only needed for high traffic

---

## 🚀 Final Integration Steps

### 1. Update Backend CORS
```env
# On Render
CORS_ORIGIN=https://shadowtalk-frontend.vercel.app
```

### 2. Test Complete Flow

**Open 2 browser windows:**

Window 1:
1. Visit your Vercel URL
2. Join anonymous
3. Create room "Test"
4. Send message "Hello from Window 1"

Window 2:
1. Visit your Vercel URL (incognito)
2. Join anonymous
3. Join "Test" room
4. See message appear instantly! ✅

### 3. Test DMs
1. Get User ID from room message
2. Navigate to `/dm/{userId}`
3. Send DM
4. See in both windows instantly ✅

---

## 📱 Mobile Testing

Test on mobile:
1. Open your Vercel URL on phone
2. Should be fully responsive
3. Dark theme works
4. All features functional

---

## 🎉 Deployment Complete!

Your app is now live at:
- **Frontend**: `https://shadowtalk-frontend.vercel.app`
- **Backend**: `https://shadowtalk-backend.onrender.com`

### Share With Users:
```
🌑 ShadowTalk is Live!

Anonymous chat platform - no sign up required!
Visit: https://shadowtalk-frontend.vercel.app

Features:
✨ Public chat rooms
💬 Private DMs
👍 Reactions & replies
🛡️ Content moderation
🎭 100% anonymous
```

---

## 🔄 Continuous Deployment

Your workflow now:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Automatic deployments:
# → Vercel redeploys frontend (1-2 min)
# → Render redeploys backend (2-3 min)
# → Live in production!
```

---

## 📞 Support

**Issues?**
- Check Vercel build logs
- Check Render service logs  
- Test locally first
- Verify environment variables

**All working?** 🎊
- Share with friends
- Get feedback
- Monitor analytics
- Enjoy your live app!

---

**Next:** Monitor usage and scale as needed! 📈

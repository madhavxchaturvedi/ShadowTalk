# 🚀 Render Backend Deployment Guide

## Prerequisites
- GitHub account with ShadowTalk repo pushed
- Render account (free tier available)
- MongoDB Atlas account (free tier)

---

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a **Free M0 Cluster**
3. Choose a cloud provider (AWS recommended)
4. Create **Database User**:
   - Username: `shadowtalk`
   - Password: (generate strong password, save it!)
5. **Network Access**: Add IP `0.0.0.0/0` (allow all - Render IPs change)
6. Get **Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your actual password
   - Should look like: `mongodb+srv://shadowtalk:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/shadowtalk?retryWrites=true&w=majority`

---

## Step 2: Push to GitHub

```bash
cd /Users/madhavchaturvedi/SDE/Projects/ShadowTalk

# Initialize git if not done
git init
git add .
git commit -m "Production ready ShadowTalk"

# Push to GitHub
git remote add origin https://github.com/madhavxchaturvedi/ShadowTalk.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy Backend to Render

### 3.1 Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select **ShadowTalk** repository

### 3.2 Configure Service

**Basic Settings:**
- **Name**: `shadowtalk-backend`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Select **Free** tier (or Starter for better performance)

### 3.3 Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://shadowtalk:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/shadowtalk?retryWrites=true&w=majority
JWT_SECRET=YOUR_SECURE_RANDOM_STRING_HERE
CORS_ORIGIN=https://shadowtalk.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important Notes:**
- Replace `YOUR_PASSWORD` in `MONGODB_URI` with your actual MongoDB password
- Replace `YOUR_SECURE_RANDOM_STRING_HERE` with the generated JWT secret
- Update `CORS_ORIGIN` with your actual Vercel URL (you'll get this after deploying frontend)

### 3.4 Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repo
   - Install dependencies
   - Start the server
3. Wait for deployment (3-5 minutes)
4. You'll get a URL like: `https://shadowtalk-backend.onrender.com`

### 3.5 Verify Deployment

```bash
curl https://shadowtalk-backend.onrender.com/health
```

Expected response:
```json
{
  "success": true,
  "message": "ShadowTalk API is running",
  "environment": "production",
  "timestamp": "2025-11-30T..."
}
```

---

## Step 4: Update CORS After Frontend Deployment

**After you deploy to Vercel:**

1. Go to Render Dashboard → Your Service → Environment
2. Update `CORS_ORIGIN` to your Vercel URL:
   ```
   CORS_ORIGIN=https://shadowtalk-frontend.vercel.app
   ```
3. Click **"Save Changes"**
4. Render will auto-redeploy

---

## 🔧 Important Render Settings

### Auto-Deploy from GitHub

Render automatically redeploys when you push to `main`:

```bash
git add .
git commit -m "Update feature"
git push
# Render auto-deploys in 2-3 minutes
```

### Health Checks

Render automatically monitors `/health` endpoint.

### Logs

View logs in real-time:
- Dashboard → Your Service → **Logs** tab
- Watch for errors during deployment

### Free Tier Limitations

⚠️ **Important**: Free tier sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Upgrade to Starter ($7/month) for 24/7 uptime

---

## 🐛 Troubleshooting

### Build Failed
**Check:**
- `package.json` has correct `"type": "module"`
- All dependencies in `package.json`
- Node version compatible (18+)

**Fix:** Add to Render environment:
```
NODE_VERSION=20
```

### MongoDB Connection Error
**Check:**
- IP whitelist includes `0.0.0.0/0`
- Password has no special characters (or URL encoded)
- Database user has read/write permissions

### CORS Errors
**Check:**
- `CORS_ORIGIN` matches your Vercel URL exactly
- No trailing slash in URL
- HTTPS (not HTTP)

### Service Sleeps (Free Tier)
**Solutions:**
1. Upgrade to Starter plan
2. Use a cron job to ping every 14 minutes:
   ```bash
   */14 * * * * curl https://shadowtalk-backend.onrender.com/health
   ```
3. Use [UptimeRobot](https://uptimerobot.com/) (free) to ping every 5 minutes

---

## 📊 Monitoring

### Check Service Health

```bash
# Health check
curl https://shadowtalk-backend.onrender.com/health

# Test auth endpoint
curl https://shadowtalk-backend.onrender.com/api/auth/create-session -X POST

# Check rooms
curl https://shadowtalk-backend.onrender.com/api/rooms
```

### Performance Metrics

Render provides:
- CPU usage
- Memory usage
- Response times
- Error rates

Access in Dashboard → Service → Metrics

---

## 🔐 Security Checklist

- [x] Environment variables set (not hardcoded)
- [x] MongoDB Atlas IP whitelist configured
- [x] Strong JWT secret (32+ characters)
- [x] CORS restricted to your domain
- [x] HTTPS enabled (automatic on Render)
- [x] Rate limiting enabled
- [x] Helmet.js security headers

---

## 🎯 Your Backend URL

After deployment, you'll have:

```
Production Backend: https://shadowtalk-backend.onrender.com
Health Check: https://shadowtalk-backend.onrender.com/health
API Base: https://shadowtalk-backend.onrender.com/api
```

**Save this URL** - you'll need it for Vercel frontend deployment!

---

## 🚀 Next Steps

1. ✅ Backend deployed to Render
2. ➡️ **Next: Deploy Frontend to Vercel** (see `VERCEL_DEPLOYMENT.md`)
3. Update `CORS_ORIGIN` on Render with Vercel URL
4. Test end-to-end with production URLs

---

## 💰 Cost

**Free Tier:**
- 750 hours/month free
- Sleeps after 15 min inactivity
- Good for testing

**Starter ($7/month):**
- Always on
- Better performance
- **Recommended for production**

---

Ready to deploy frontend? See `VERCEL_DEPLOYMENT.md` next!

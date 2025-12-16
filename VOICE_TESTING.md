# 🧪 Voice Rooms - Quick Testing Guide

## Prerequisites
- ✅ Backend installed & running
- ✅ Frontend installed & running
- ✅ MongoDB connection active
- ✅ Modern browser (Chrome/Firefox/Edge)
- ✅ Microphone available

---

## 🚀 Quick Start

### 1. Start Services

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. Create Voice Room

1. Open http://localhost:5173
2. Login/Create session (automatic)
3. Click **"+ Create Room"**
4. Fill in details:
   - Name: "Test Voice Room"
   - Description: "Testing voice features"
   - Topic: Choose any
   - **Room Type: Select "🎧 Text + Voice"** ⬅️ IMPORTANT!
5. Click "Create Room"

### 3. Test Voice Features

**Join Voice:**
1. Click **"Join Voice"** button in the voice channel section
2. Allow microphone access when prompted
3. You should see yourself in the participants list

**Test Controls:**
- Click **Mic button** (🎤) to mute/unmute
- Click **Headphones button** (🎧) to deafen
- Click **Phone button** (📞) to leave voice

**Voice Activity:**
- Speak into microphone
- Your avatar should get a green ring when speaking

### 4. Multi-User Test

**Option A: Multiple Browser Windows**
1. Open another browser window (incognito/private)
2. Go to http://localhost:5173
3. Join the same room
4. Click "Join Voice" in both windows
5. Speak in one window, hear in the other

**Option B: Different Devices**
1. Connect another device to same network
2. Go to http://YOUR_IP:5173
3. Join same room
4. Test voice between devices

---

## ✅ Verification Checklist

### Backend Console
You should see logs like:
```
✅ Socket connected: <socket-id>
🎤 User <anonymousId> joining voice in room <roomId>
📞 WebRTC offer from <user> to <socket-id>
📞 WebRTC answer from <user> to <socket-id>
```

### Frontend Console (F12)
You should see:
```
✅ Local audio stream initialized
👥 Received participants: [...]
🎵 Received remote track from: <anonymousId>
```

### UI Indicators
- [x] Voice channel card visible
- [x] "Join Voice" button clickable
- [x] Participants list updates
- [x] Mute/deafen buttons toggle
- [x] Speaking indicator appears

### Audio Test
- [x] Can hear yourself echo (if 2 windows open)
- [x] Other user's audio plays
- [x] Mute stops audio transmission
- [x] Deafen stops audio reception

---

## 🐛 Common Issues & Fixes

### Issue: "Microphone access denied"
**Fix:**
- Chrome: Settings → Privacy → Site Settings → Microphone
- Allow microphone for localhost

### Issue: "No audio from other user"
**Check:**
1. Are you deafened? (headphones icon red)
2. Is other user muted?
3. Check browser audio tab (right-click tab)

### Issue: "Cannot join voice"
**Check:**
1. Backend running? (check terminal)
2. MongoDB connected?
3. Room type is 'voice' or 'both'?

### Issue: "WebRTC connection failed"
**Check:**
1. Browser console for errors
2. Firewall blocking ports?
3. Both on same network for local test

### Issue: "Echo/feedback"
**Fix:**
- Use headphones
- Or test with 2 devices
- Or mute one browser window

---

## 📊 Expected Behavior

### Single User
```
1. Join voice → See yourself in participants (1 participant)
2. Mute → Mic icon turns red
3. Speak → No speaking indicator (muted)
4. Unmute → Mic icon normal
5. Speak → Green ring appears around avatar
6. Deafen → Headphones icon red + auto-muted
7. Leave → Participants list empty
```

### Two Users
```
User A                          User B
1. Join voice                   Join voice
2. See User B in list    ←→    See User A in list
3. Speak                 →      Hear User A
4. Mute                         See User A muted icon
5.                       ←      Speak
6. Hear User B                  
7. Deafen                       
8. Don't hear User B     ←      Speaking
```

---

## 📸 Screenshots to Verify

### Before Joining Voice
```
┌─────────────────────────────┐
│ 🔊 Voice Channel            │
├─────────────────────────────┤
│                             │
│  [  Join Voice  ]           │
│                             │
└─────────────────────────────┘
```

### After Joining Voice
```
┌─────────────────────────────┐
│ 🔊 Voice Channel            │
├─────────────────────────────┤
│ In Voice — 1 participant    │
│                             │
│ 👤 Shadow123 (You)          │
│                             │
│ [ 🎤 Mute ] [ 🎧 Deafen ]  │
│ [ 📞 Leave ]                │
│                             │
│ 🔒 Anonymous • No recording │
└─────────────────────────────┘
```

---

## 🎯 Success Criteria

✅ Can create voice/mixed rooms  
✅ Can join voice channel  
✅ Microphone permission works  
✅ Can hear other users  
✅ Mute/unmute works  
✅ Deafen works  
✅ Speaking indicator shows  
✅ Can leave voice cleanly  
✅ Multiple users can join  
✅ WebRTC connections stable  

---

## 📝 Test Results Template

Copy and fill out:

```
Test Date: __________
Browser: __________

Single User Test:
[ ] Created voice room
[ ] Joined voice successfully
[ ] Mute button works
[ ] Deafen button works
[ ] Speaking indicator works
[ ] Leave voice works

Multi-User Test:
[ ] 2 users can join same voice channel
[ ] Audio heard between users
[ ] Participant list updates
[ ] Status indicators sync
[ ] Reconnection works

Issues Found:
- 
- 

Notes:
- 
```

---

## 🆘 Need Help?

Check these files:
- `VOICE_ROOMS.md` - Full documentation
- Backend logs in terminal
- Browser console (F12)
- Network tab for WebSocket/API calls

---

*Happy Testing! 🎤*

# ShadowTalk UI Testing Checklist

## 🧪 Testing Environment
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Recommendation**: Use 2+ browser windows/incognito tabs to test real-time features

---

## ✅ Week 1-2: Authentication & Basic Rooms

### Anonymous Session Creation
- [ ] Visit homepage - should see "Join as Anonymous" button
- [ ] Click "Join as Anonymous" - generates random anonymous ID (e.g., "ShadowUser_abc123")
- [ ] Check localStorage has auth token
- [ ] Refresh page - should stay logged in (rejoin session)
- [ ] Username format validation (3-20 chars, alphanumeric + underscore)

### Room Discovery & Creation
- [ ] See list of available rooms on homepage
- [ ] Each room shows: name, description, participant count, message count
- [ ] Click "Create Room" button
- [ ] Enter room name (required) and description (optional)
- [ ] New room appears in list immediately
- [ ] Validation: Room name required, max lengths enforced

### Joining Rooms
- [ ] Click on any room card
- [ ] Navigate to `/room/:roomId`
- [ ] See room name in header
- [ ] See participant count update in real-time
- [ ] Can leave room (navigate back)
- [ ] Join multiple rooms in different tabs - each works independently

---

## ✅ Week 3-4: Real-time Messaging & Reactions

### Send Messages
- [ ] Type message in input box at bottom
- [ ] Click "Send" or press Enter
- [ ] Message appears instantly in chat
- [ ] Your messages appear on the RIGHT side (blue background)
- [ ] Message shows: anonymousId, content, timestamp
- [ ] Empty messages blocked

### Receive Messages (Real-time)
- [ ] Open same room in 2 browser windows
- [ ] Send message from Window A
- [ ] Message appears in Window B **instantly** (no refresh needed)
- [ ] Other users' messages appear on LEFT side (gray background)
- [ ] Timestamps show in local time (HH:MM format)

### Message Reactions
- [ ] Hover over any message - see reaction buttons (👍 ❤️ 😂 😮 😢 🔥)
- [ ] Click a reaction - it highlights and count increases
- [ ] Click again - removes your reaction and count decreases
- [ ] See reaction counts update in real-time across all clients
- [ ] Each user can add multiple different reactions to same message
- [ ] Cannot add same reaction twice

### Threading (Replies)
- [ ] Click "Reply" button on any message
- [ ] Thread view opens showing original message
- [ ] Type and send reply
- [ ] Reply appears under original message
- [ ] Reply count badge appears on original message
- [ ] Click "View Replies (X)" to see all replies
- [ ] Navigate back to main room
- [ ] Reply counts update in real-time

---

## ✅ Week 5: Direct Messages & Reputation

### DM List & Navigation
- [ ] Click "Messages" in navigation
- [ ] See list of all DM conversations
- [ ] Each conversation shows: other user's ID, last message preview, unread count
- [ ] Conversations sorted by most recent first
- [ ] Click a conversation - navigates to `/dm/:userId`
- [ ] Back button returns to DM list

### Sending DMs
- [ ] **Test 1 - Start New Conversation:**
  - [ ] Get another user's ID from a room message
  - [ ] Navigate to `/dm/{their-user-id}` manually
  - [ ] Type and send message
  - [ ] Message appears instantly on YOUR side (right, blue)
  - [ ] No refresh needed

- [ ] **Test 2 - Sender View (Window A):**
  - [ ] Send DM to User B
  - [ ] Message appears immediately on right side
  - [ ] Shows your anonymousId
  - [ ] Shows timestamp
  - [ ] Can send multiple messages rapidly

- [ ] **Test 3 - Receiver View (Window B):**
  - [ ] Open DM with User A in another window
  - [ ] When A sends message, it appears **instantly** on left side
  - [ ] No page refresh needed
  - [ ] Shows sender's anonymousId
  - [ ] Shows correct timestamp

### Auto-Scroll Feature 🆕
- [ ] Send multiple messages in DM
- [ ] Page automatically scrolls to show newest message
- [ ] Smooth scroll animation
- [ ] Always see the latest message without manual scrolling

### DM Edge Cases
- [ ] **No Duplicates:** Messages don't appear twice
- [ ] **Offline Messaging:** Send DM when receiver is offline (close their tab)
  - [ ] Message saves to database
  - [ ] When receiver reopens DM, message is there
- [ ] **Empty DM:** Visit DM with user who never messaged you
  - [ ] Shows "No messages yet" placeholder
  - [ ] Still loads other user's info (anonymousId, reputation)
  - [ ] Can send first message successfully

### Reputation System
- [ ] Check user reputation in DM header
- [ ] Reputation shown as number (default: 0)
- [ ] Visit `/api/users/:userId` in browser - see reputation in JSON
- [ ] Reputation persists across sessions

---

## 🎨 UI/UX Features

### Dark Theme
- [ ] Entire app uses dark theme
- [ ] No light mode flash on page load
- [ ] CSS variables working (--bg-primary, --accent, etc.)
- [ ] Readable text contrast
- [ ] Consistent colors across all pages

### Navigation
- [ ] Header shows: Logo/Home, Rooms, Messages
- [ ] Active page highlighted in nav
- [ ] Clicking logo returns to homepage
- [ ] All navigation links work
- [ ] Mobile responsive (test on narrow window)

### Loading States
- [ ] Loading spinner shows while fetching rooms
- [ ] Loading spinner shows while fetching DMs
- [ ] Loading spinner shows while fetching messages
- [ ] "Sending..." state on submit buttons
- [ ] Buttons disabled during API calls

### Error Handling
- [ ] Try visiting `/dm/invalid-user-id` - shows alert and redirects
- [ ] Try visiting `/room/invalid-room-id` - shows error
- [ ] Network errors show user-friendly messages
- [ ] Form validation errors display clearly

---

## 🔥 Critical Real-time Tests

### Test 1: Multi-User Room Chat
**Setup:** 3 browser windows, all in same room

1. Window A sends message → appears in B & C instantly ✅
2. Window B reacts to A's message → reaction count updates in all windows ✅
3. Window C replies to A's message → reply count updates everywhere ✅
4. All timestamps accurate and consistent ✅

### Test 2: Bidirectional DMs
**Setup:** 2 browser windows, User A & User B in DM

1. A sends "Hello" → A sees it immediately on right, B sees it on left ✅
2. B sends "Hi" → B sees it immediately on right, A sees it on left ✅
3. Both send messages rapidly → all appear, no duplicates, correct order ✅
4. Auto-scroll works in both windows ✅

### Test 3: Persistence
**Setup:** Send data, close browser, reopen

1. Create room → close tab → reopen → room still exists ✅
2. Send messages → refresh page → messages still there ✅
3. Send DM → close browser → reopen → DM conversation persists ✅
4. Join session → close tab → reopen → still logged in ✅

### Test 4: Socket Reconnection
**Setup:** Simulate network interruption

1. Open room in 2 windows
2. In DevTools, go to Network tab → Throttle to "Offline"
3. Send message from other window → doesn't appear
4. Set back to "Online" → message should appear (Socket.io auto-reconnects)
5. Verify real-time features still work

---

## 🐛 Known Issues to Verify Fixed

- [x] ~~Messages not showing real-time (had to refresh)~~ → **FIXED** ✅
- [x] ~~500 errors on replies with timestamp IDs~~ → **FIXED** ✅
- [x] ~~Sender doesn't see own DM messages~~ → **FIXED** ✅
- [x] ~~Duplicate messages in DMs~~ → **FIXED** ✅
- [x] ~~DMs fail if receiver offline~~ → **FIXED** (saves to DB) ✅
- [x] ~~No auto-scroll for new messages~~ → **FIXED** ✅
- [x] ~~Light theme flashing on load~~ → **FIXED** ✅

---

## 📊 Performance Checks

- [ ] Room list loads in < 2 seconds
- [ ] Message send latency < 500ms
- [ ] Real-time updates appear within 200ms
- [ ] No console errors in browser DevTools
- [ ] No memory leaks (check DevTools Memory tab after 5+ mins usage)
- [ ] Smooth scrolling with 100+ messages

---

## 🚀 Quick 5-Minute Smoke Test

**Minimal test to verify everything works:**

1. ✅ Create anonymous session
2. ✅ Create new room
3. ✅ Send message in room (open 2 tabs, verify real-time)
4. ✅ Add reaction to message
5. ✅ Reply to message
6. ✅ Open Messages page
7. ✅ Send DM to another user (test with 2 windows)
8. ✅ Verify auto-scroll in DM
9. ✅ Refresh page - all data persists
10. ✅ No errors in console

**If all 10 pass → App is production-ready for basic testing!** 🎉

---

## 📱 Browser Compatibility

Test on multiple browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Chrome (iOS/Android)
- [ ] Mobile Safari (iOS)

---

## 🔧 Developer Tools Checks

### Console (F12 → Console tab)
- [ ] No red errors during normal usage
- [ ] Socket.io connection logs show "connected"
- [ ] API calls return 200/201 status codes
- [ ] No CORS errors

### Network Tab
- [ ] WebSocket connection active (ws://localhost:3001)
- [ ] API requests complete successfully
- [ ] No 404 or 500 errors
- [ ] Reasonable payload sizes

### Application Tab → Local Storage
- [ ] `token` key exists after login
- [ ] Token is valid JWT format
- [ ] Persists across page reloads

---

## 🎯 Next Steps After Testing

If you find bugs:
1. Note exact steps to reproduce
2. Check browser console for errors
3. Report here with details

If everything works:
1. ✅ Week 5 complete!
2. Ready to proceed to Week 6-7 (Moderation & Safety)
3. Consider deploying to test with real users

---

**Happy Testing! 🧪** Let me know what issues you find!

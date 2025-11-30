# ShadowTalk - Complete Copilot Guide for Development

## 📋 What is ShadowTalk?

**ShadowTalk** is an anonymous, Discord-like social network where users can:
- Join topic-based communities without revealing their identity
- Send messages, reactions, and threaded replies in real-time
- Send private messages to other anonymous users
- Earn reputation points and badges for positive participation
- Report harmful content with AI-powered moderation

**Key Differentiator:** Combines Discord-like features with true anonymity and AI moderation—no existing platform does this well.

---

## 🎯 Project Analysis

### Market Opportunity
- **Target Market:** Privacy-conscious users, support seekers, honest communities
- **Competition:** Discord (no anonymity), Whisper (no features), Reddit (semi-anonymous)
- **Gap:** No platform offers Discord UX + true anonymity + AI moderation
- **TAM:** Estimated 50M+ privacy-conscious internet users globally

### Why This Works
1. Privacy is increasingly valued (especially post-Elon Twitter, data breaches)
2. Anonymous communities have high engagement (Reddit, 4chan demonstrate this)
3. AI moderation solves the "anonymous platform = toxic" problem
4. Discord-like features make it more powerful than existing anonymous apps

### Technical Viability
- **Stack:** MERN (your expertise)
- **Complexity:** Medium-High (real-time, AI integration, moderation)
- **Timeline:** 8 weeks for MVP (achievable solo or with team)
- **Cost:** ~$200-500/month for hosting + AI APIs at scale

---

## 🏗️ Project Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    ShadowTalk Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐         ┌──────────────────────┐  │
│  │   React Frontend     │         │   Node.js Backend    │  │
│  │  - Room List UI      │◄────────►│  - Express.js API    │  │
│  │  - Chat Interface    │ HTTP/WS  │  - Socket.io Server  │  │
│  │  - Profile Page      │          │  - JWT Auth          │  │
│  │  - DM Inbox          │          │                      │  │
│  └──────────────────────┘          └──────────────────────┘  │
│           ▲                                     ▲              │
│           │ Socket.io (Real-Time)              │ Queries      │
│           │                                    │              │
│           └────────────────┬───────────────────┘              │
│                            │                                   │
│                    ┌───────▼────────┐                         │
│                    │   MongoDB      │                         │
│                    │  - Users       │                         │
│                    │  - Rooms       │                         │
│                    │  - Messages    │                         │
│                    │  - DMs         │                         │
│                    │  - Reports     │                         │
│                    └────────────────┘                         │
│                                                               │
│            ┌─────────────────────────────────────┐           │
│            │    AI Moderation Pipeline           │           │
│            │  - OpenAI API (Content Filtering)   │           │
│            │  - Real-time Content Safety Check   │           │
│            │  - Auto-delete / Flag for review    │           │
│            └─────────────────────────────────────┘           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Registration:** Browser → JWT Session → Anonymous ID generated
2. **Messaging:** User types → Validated → AI checks → Socket.io broadcasts → All users see real-time
3. **Moderation:** Message posted → AI analyzes → If safe: displays; If flagged: hidden for review
4. **Reputation:** User posts/reacts → Points awarded → Level updated → Badge unlocked

---

## 📊 Feature Priority & Dependencies

### Phase 1 MVP (Weeks 1-8)

```
Week 1-2: Foundation
├── Anonymous Session System (JWT)
├── Room CRUD APIs
└── Basic Database Setup

Week 2-3: Core Messaging
├── Real-Time Chat (Socket.io)
├── Message Storage
└── Emoji Reactions

Week 3-4: Enhanced Messaging
├── Threaded Replies
├── Message Timestamps
└── Chat UI Components

Week 4-5: Private Messaging & Reputation
├── DM System
├── Reputation Points Tracking
├── Level/Badge System
└── User Profiles

Week 6: AI Moderation
├── OpenAI API Integration
├── Content Filtering Middleware
└── Moderation Queue

Week 7: Safety Features
├── User Reporting System
├── Blocking Functionality
├── Moderation Dashboard
└── Admin Tools

Week 8: Polish & Deploy
├── Testing & Bug Fixes
├── Performance Optimization
├── Deployment Setup
└── Closed Beta Launch
```

---

## 🛠️ Tech Stack Breakdown

### Frontend (React)
```
Client-Side Architecture:
├── Pages
│   ├── Home (Room Discovery)
│   ├── Room (Chat Interface)
│   ├── DMs (Private Messages)
│   └── Profile (User Stats)
│
├── Components
│   ├── Navbar
│   ├── Sidebar (Room List)
│   ├── ChatArea (Messages)
│   ├── MessageItem (Message + Reactions)
│   ├── InputArea (Text Input)
│   ├── ReactionPicker
│   ├── UserProfile
│   └── ReportModal
│
├── Services
│   ├── api.js (Axios HTTP Client)
│   ├── socket.js (Socket.io Client)
│   └── auth.js (Session Management)
│
└── State Management
    └── React Context / Redux (for global state)
```

### Backend (Node.js + Express)
```
Server-Side Architecture:
├── Routes
│   ├── /api/auth (Session management)
│   ├── /api/rooms (Room CRUD)
│   ├── /api/messages (Messaging)
│   ├── /api/dms (Private messages)
│   ├── /api/users (User profiles)
│   ├── /api/admin (Moderation)
│   └── /api/reports (User reports)
│
├── Models (Mongoose)
│   ├── User (Anonymous sessions + reputation)
│   ├── Room (Communities)
│   ├── Message (Room messages + reactions)
│   ├── PrivateMessage (DMs)
│   ├── Report (User reports)
│   └── ReputationLog (Point history)
│
├── Middleware
│   ├── authMiddleware (JWT validation)
│   ├── aiModeration (Content filtering)
│   ├── errorHandler (Error responses)
│   └── rateLimiter (Spam prevention)
│
├── Sockets (Socket.io)
│   ├── room:join (User joins room)
│   ├── room:leave (User leaves room)
│   ├── message:send (Send message)
│   ├── message:reaction (Add reaction)
│   ├── user:typing (Typing indicator)
│   └── user:disconnect (User leaves)
│
└── Utils
    ├── validators.js (Input validation)
    ├── aiModeration.js (OpenAI integration)
    └── helpers.js (Helper functions)
```

### Database (MongoDB)

**Collections:**
1. **users** – Anonymous sessions, reputation, preferences
2. **rooms** – Community metadata, settings, members
3. **messages** – Room messages, reactions, threading
4. **privateMessages** – 1-on-1 conversations
5. **reports** – User reports on content/users
6. **reputationLogs** – Point history for analytics

---

## 🚀 Week-by-Week Development Roadmap

### Week 1: Foundation & Setup

**Goals:**
- Set up project structure
- Initialize backend (Express + MongoDB)
- Initialize frontend (React)
- Implement JWT-based session system

**Tasks:**
```
Backend:
□ Create Express server on port 3001
□ Set up MongoDB connection (localhost or Atlas)
□ Create User model (anonymous sessions only)
□ Implement /api/auth/create-session endpoint
□ Implement /api/auth/join-session endpoint
□ Create middleware for JWT auth
□ Set up CORS and error handling

Frontend:
□ Create React app structure
□ Set up Axios for API calls
□ Create auth service
□ Create simple login flow
□ Store JWT token in localStorage
□ Create basic navbar + layout
```

**Deliverables:**
- ✅ Users can visit app and get assigned anonymous ID
- ✅ Session persists across refresh
- ✅ Backend API tested in Postman

**Potential Blockers:**
- MongoDB connection issues → Use MongoDB Atlas for easy setup
- JWT token expiration → Implement refresh token logic

---

### Week 2: Rooms & Room Discovery

**Goals:**
- Build room management APIs
- Build room listing UI
- Implement room join/leave functionality

**Tasks:**
```
Backend:
□ Create Room model (name, description, topic, members, etc.)
□ Implement POST /api/rooms (create room)
□ Implement GET /api/rooms (list all rooms)
□ Implement GET /api/rooms/:id (get room details)
□ Implement POST /api/rooms/:id/join (user joins)
□ Implement POST /api/rooms/:id/leave (user leaves)
□ Add room member count tracking
□ Add trending room sorting (by activity)

Frontend:
□ Create RoomList component
□ Create RoomItem component
□ Create CreateRoomModal
□ Build room discovery feed
□ Build trending rooms section
□ Implement room join button
□ Show room member count + topic
```

**Deliverables:**
- ✅ Users can browse public rooms
- ✅ Users can create new rooms
- ✅ Users can join/leave rooms
- ✅ Rooms show member count and activity

**Potential Blockers:**
- Duplicate room names → Add slug field for uniqueness
- Room visibility → Filter by topic/tags early

---

### Week 3: Real-Time Messaging (Core!)

**Goals:**
- Implement Socket.io for real-time messaging
- Build chat UI
- Add message storage and retrieval

**Tasks:**
```
Backend:
□ Set up Socket.io server on port 3001
□ Create Message model (content, authorId, roomId, reactions, etc.)
□ Implement socket.on('room:join') handler
□ Implement socket.on('room:leave') handler
□ Implement socket.on('message:send') handler
□ Save messages to MongoDB in real-time
□ Emit 'message:new' to all room members
□ Implement GET /api/rooms/:id/messages (fetch history)
□ Add pagination for message history

Frontend:
□ Install socket.io-client
□ Create Socket service
□ Create ChatArea component
□ Create MessageList component
□ Implement real-time message rendering
□ Add auto-scroll to latest message
□ Display message author anonymousId + timestamp
□ Add message input form
```

**Deliverables:**
- ✅ Messages appear instantly for all users in room
- ✅ Message history loads when entering room
- ✅ Real-time latency < 500ms
- ✅ No message loss on disconnect/reconnect

**Potential Blockers:**
- Socket.io connection issues → Use Socket.io middleware for auth
- Message ordering → Add timestamps + sort by createdAt
- Large message history → Implement pagination (load 50 at a time)

---

### Week 4: Reactions & Threaded Replies

**Goals:**
- Add emoji reactions to messages
- Implement threaded replies for discussions
- Polish chat UX

**Tasks:**
```
Backend:
□ Add reactions field to Message schema (emoji → [userIds])
□ Implement POST /api/messages/:id/reaction (add reaction)
□ Implement socket.on('message:reaction') handler
□ Emit 'message:reaction' to all room members
□ Add replyTo field to Message for threading
□ Implement nested replies fetching
□ Add support for reply threading in chat

Frontend:
□ Create ReactionPicker component (emoji picker)
□ Add reaction button to MessageItem
□ Display reaction counts under messages
□ Handle reaction click + submit to backend
□ Create ThreadedReply component
□ Show replies nested under parent message
□ Add reply-to indicator in UI
□ Add reply form (quote parent message)
```

**Deliverables:**
- ✅ Users can react with emojis
- ✅ Reaction counts update in real-time
- ✅ Users can reply to specific messages
- ✅ Threaded conversations are organized

**Potential Blockers:**
- Emoji picker library bloat → Use simple emoji button list
- Threading complexity → Keep it simple (just 1 level of replies for MVP)

---

### Week 5: Private Messaging & Reputation System

**Goals:**
- Implement DM functionality
- Build reputation/points system
- Create user profiles

**Tasks:**
```
Backend:
□ Create PrivateMessage model
□ Implement POST /api/dms/:recipientId (send DM)
□ Implement GET /api/dms (list conversations)
□ Implement GET /api/dms/:conversationId (get thread)
□ Create ReputationLog model
□ Award points on message: +1 point
□ Award points on reaction received: +1 point
□ Award points on reaction given: +0.5 points
□ Calculate user level based on points
□ Implement GET /api/users/:id (user profile with stats)
□ Add badges based on level

Frontend:
□ Create DMs page
□ Create ConversationList component
□ Create DMThread component
□ Implement send DM form
□ Create UserProfile component
□ Display reputation points + level
□ Show earned badges
□ Display activity history
□ Add profile access from anonymousId click
```

**Deliverables:**
- ✅ Users can send/receive private messages
- ✅ Users see DM conversation history
- ✅ Reputation points awarded automatically
- ✅ User profiles show level and badges
- ✅ Users can see activity history

**Potential Blockers:**
- DM notification timing → Implement notifications in future phase
- Point system balancing → Start simple, tweak later based on usage

---

### Week 6: AI Content Moderation (Integration)

**Goals:**
- Integrate OpenAI API for content filtering
- Implement moderation queue
- Protect community from harmful content

**Tasks:**
```
Backend:
□ Install OpenAI SDK
□ Create checkContentSafety middleware
□ Call OpenAI moderation API on message submit
□ Add isModerated, flaggedFor fields to Message
□ Auto-delete messages flagged as harmful
□ Hide flagged messages from other users
□ Create moderation queue endpoint: GET /api/admin/reports
□ Implement /api/admin/reports/:id/resolve (handle report)
□ Log all moderation actions for audit trail

Frontend:
□ Create ModeratorDashboard (admin only)
□ Show pending reports in queue
□ Display flagged messages + reason
□ Add approve/reject/delete buttons
□ Show moderation history
□ Alert user if message was flagged
□ Allow user to appeal moderation decision
```

**Deliverables:**
- ✅ Harmful content blocked before posting
- ✅ Moderation accuracy > 95%
- ✅ False positive rate < 5%
- ✅ Moderation dashboard functional
- ✅ Audit trail for all decisions

**Potential Blockers:**
- OpenAI API costs → Monitor usage, set rate limits
- Moderation false positives → Fine-tune prompts, allow appeals
- Latency of AI checks → Implement caching for common patterns

---

### Week 7: User Reporting & Safety Tools

**Goals:**
- Implement user reporting system
- Add user blocking functionality
- Complete safety infrastructure

**Tasks:**
```
Backend:
□ Create Report model (reportedMessage, reportedUser, reason, status)
□ Implement POST /api/messages/:id/report
□ Implement POST /api/users/:id/report
□ Implement POST /api/users/:id/block
□ Track blocked user relationships
□ Filter messages/users based on blocks
□ Implement GET /api/admin/reports (moderator queue)
□ Add report analytics

Frontend:
□ Add report button to MessageItem
□ Create ReportModal (reason dropdown + description)
□ Submit report + show confirmation
□ Add "Block User" option in profiles
□ Show block status in DM threads
□ Prevent messaging blocked users
□ Add blocked user list to profile settings
□ Create "Report History" page for admins
```

**Deliverables:**
- ✅ Users can report inappropriate content
- ✅ Users can block other users
- ✅ Moderation queue handles reports
- ✅ Blocked users cannot contact each other
- ✅ Admin dashboard shows all reports

---

### Week 8: Polish, Testing & Deployment

**Goals:**
- Test thoroughly
- Optimize performance
- Deploy to production
- Launch closed beta

**Tasks:**
```
Backend:
□ Write unit tests for auth endpoints
□ Write tests for message creation/retrieval
□ Load test: 100 concurrent users
□ Load test: 1000 messages/minute
□ Security audit: validate all inputs
□ Security audit: check SQL injection, XSS
□ API documentation (Swagger/Postman)
□ Deploy to Railway or Render
□ Set up MongoDB Atlas (production DB)
□ Set up environment variables (.env)
□ Enable CORS for frontend domain
□ Add request logging + monitoring
□ Set up error tracking (Sentry)

Frontend:
□ Fix responsive design for mobile
□ Test all features in production build
□ Optimize bundle size (code splitting)
□ Add loading states + error handling
□ Test dark mode (optional)
□ Performance audit (Lighthouse)
□ Deploy to Vercel
□ Configure custom domain
□ Set up analytics (optional)

Final:
□ Create landing page (shadowtalk.io)
□ Write Terms of Service
□ Write Privacy Policy
□ Prepare closed beta user list (20-50 people)
□ Create onboarding guide
□ Prepare feedback survey
□ Launch closed beta
□ Monitor for bugs + crashes
□ Collect user feedback
```

**Deliverables:**
- ✅ MVP deployed to production
- ✅ Zero data loss on deploy
- ✅ <200ms API response times
- ✅ 95%+ uptime
- ✅ Closed beta live with real users
- ✅ Bug tracking system in place

---

## 📁 Project File Structure

```
shadowtalk/
├── backend/
│   ├── server.js                 # Express entry point
│   ├── .env                      # Environment variables
│   ├── package.json
│   ├── config/
│   │   └── mongodb.js            # DB connection config
│   ├── models/
│   │   ├── User.js              # Anonymous user sessions
│   │   ├── Room.js              # Communities
│   │   ├── Message.js           # Room messages
│   │   ├── PrivateMessage.js    # DMs
│   │   ├── Report.js            # User reports
│   │   └── ReputationLog.js     # Point history
│   ├── routes/
│   │   ├── auth.js              # Session endpoints
│   │   ├── rooms.js             # Room endpoints
│   │   ├── messages.js          # Message endpoints
│   │   ├── dms.js               # DM endpoints
│   │   ├── users.js             # User profile endpoints
│   │   └── admin.js             # Moderation endpoints
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification
│   │   ├── aiModeration.js      # OpenAI content check
│   │   ├── errorHandler.js      # Error responses
│   │   └── rateLimiter.js       # Rate limiting
│   ├── socket/
│   │   └── socketEvents.js      # Socket.io handlers
│   ├── utils/
│   │   ├── validators.js        # Input validation
│   │   └── helpers.js           # Helper functions
│   └── tests/
│       ├── auth.test.js
│       ├── messages.test.js
│       └── moderation.test.js
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── pages/
│   │   │   ├── Home.jsx         # Room discovery
│   │   │   ├── Room.jsx         # Chat interface
│   │   │   ├── DMs.jsx          # Private messages
│   │   │   └── Profile.jsx      # User profile
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ChatArea.jsx
│   │   │   ├── MessageItem.jsx
│   │   │   ├── RoomList.jsx
│   │   │   ├── CreateRoomModal.jsx
│   │   │   ├── ReactionPicker.jsx
│   │   │   ├── UserProfile.jsx
│   │   │   ├── DMs.jsx
│   │   │   └── ReportModal.jsx
│   │   ├── services/
│   │   │   ├── api.js           # Axios HTTP client
│   │   │   ├── socket.js        # Socket.io client
│   │   │   └── auth.js          # Session management
│   │   └── utils/
│   │       ├── hooks.js         # Custom React hooks
│   │       └── constants.js     # Constants
│   ├── package.json
│   ├── .env
│   └── vite.config.js (or CRA config)
│
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── SOCKET_EVENTS.md
│   ├── DATABASE_SCHEMA.md
│   └── DEPLOYMENT.md
│
└── README.md
```

---

## 🔑 Key Implementation Tips

### 1. Anonymous Session Management
```javascript
// User visits app → Auto-generate anonymousId
const anonymousId = `Shadow${Math.random().toString(36).substr(2, 9)}`;

// Store in JWT token (no PII)
const token = jwt.sign({ anonymousId, sessionId }, JWT_SECRET);

// Validate on every request
const authMiddleware = (req, res, next) => {
  const { anonymousId } = jwt.verify(req.headers.authorization, JWT_SECRET);
  req.user = { anonymousId };
  next();
};
```

### 2. Real-Time Messaging with Socket.io
```javascript
// Server
io.on('connection', (socket) => {
  socket.on('message:send', async (data) => {
    const message = await Message.create(data);
    io.to(data.roomId).emit('message:new', message);
  });
});

// Client
socket.emit('message:send', { roomId, content, authorId });
socket.on('message:new', (message) => {
  setMessages(prev => [...prev, message]);
});
```

### 3. AI Content Moderation
```javascript
const checkContentSafety = async (content) => {
  const response = await openai.createModeration({
    input: content,
  });
  
  const { flagged, categories } = response.data.results[0];
  
  if (flagged) {
    return { safe: false, reason: Object.keys(categories)[0] };
  }
  return { safe: true };
};
```

### 4. Reputation Points
```javascript
const awardPoints = async (userId, action) => {
  const pointValue = {
    'message_posted': 1,
    'reaction_given': 0.5,
    'reaction_received': 1,
  };
  
  await ReputationLog.create({
    userId,
    action,
    points: pointValue[action],
  });
  
  const totalPoints = await ReputationLog.aggregate([
    { $match: { userId } },
    { $group: { _id: null, total: { $sum: '$points' } } },
  ]);
  
  const level = Math.floor(totalPoints / 50) + 1;
  await User.findByIdAndUpdate(userId, { reputation: { points: totalPoints, level } });
};
```

---

## 🚨 Critical Success Factors

### Performance
- Real-time latency < 500ms (critical for UX)
- API response < 200ms (for non-real-time operations)
- Message delivery reliability 99.9%+

### Moderation
- AI accuracy > 95% (catch harmful content)
- False positive rate < 5% (don't flag good content)
- Response time < 1 hour (review user reports quickly)

### Retention
- Onboarding < 10 seconds (no signup friction)
- Core features obvious (room list, messaging, profiles)
- Invite friends feature (for growth)

### Safety
- No PII stored (anonymous by design)
- HTTPS everywhere (encrypt in transit)
- Rate limiting (prevent spam/abuse)
- User reporting (community moderation)

---

## 📞 Support & Resources During Development

### Common Issues & Solutions

**Issue: Socket.io connection keeps dropping**
→ Solution: Check CORS config, add reconnection logic, use Socket.io middleware for auth

**Issue: Messages appear out of order**
→ Solution: Add timestamps, sort by createdAt on client + server, use message IDs for tracking

**Issue: OpenAI moderation too slow**
→ Solution: Cache results for duplicate messages, run moderation in background job, implement batching

**Issue: MongoDB queries too slow**
→ Solution: Add indexes on frequently queried fields (roomId, userId, createdAt), use pagination

**Issue: Frontend bundle too large**
→ Solution: Code splitting with React.lazy, remove unused dependencies, tree shaking

---

## 🎯 Success Checklist

### Week 1 ✅
- [ ] Backend server running locally
- [ ] MongoDB connected + schemas created
- [ ] JWT auth working
- [ ] Frontend can get anonymousId

### Week 2 ✅
- [ ] Room CRUD endpoints working
- [ ] Room list UI rendering
- [ ] Join/leave functionality
- [ ] Room member counts accurate

### Week 3 ✅
- [ ] Socket.io connected between frontend + backend
- [ ] Messages appear in real-time
- [ ] Message history loads correctly
- [ ] Latency < 500ms

### Week 4 ✅
- [ ] Reactions display correctly
- [ ] Threaded replies working
- [ ] Reply threads render nested
- [ ] No console errors

### Week 5 ✅
- [ ] DM system functional
- [ ] Reputation points awarded automatically
- [ ] User profiles show correct stats
- [ ] Badges display correctly

### Week 6 ✅
- [ ] AI moderation integrated
- [ ] Harmful content blocked
- [ ] Moderation dashboard shows reports
- [ ] No false positives on test messages

### Week 7 ✅
- [ ] Report button works
- [ ] Blocking prevents contact
- [ ] Blocked users list displays
- [ ] Moderation queue handles reports

### Week 8 ✅
- [ ] All tests passing
- [ ] No console errors in production build
- [ ] Deployed to Vercel + Railway
- [ ] Closed beta live with users
- [ ] Feedback survey created
- [ ] Bug tracking system active

---

## 📈 Next Phase Preview (After MVP)

### Phase 2 Features (Weeks 9-16)
- Voice & video channels (WebRTC)
- Location-based room discovery
- Creator monetization (tipping, subscriptions)
- Mobile app (React Native or PWA)
- Advanced analytics dashboard

### Phase 3 Features (Weeks 17-24)
- End-to-end encryption for private rooms
- Decentralized identity (optional OAuth2)
- Multi-language support
- Enterprise workspaces
- Marketplace for creators

---

## 🎬 Ready to Ship?

**You have everything you need to build ShadowTalk:**

✅ Complete architecture documented  
✅ Week-by-week roadmap defined  
✅ All APIs and components outlined  
✅ Database schema designed  
✅ Security & privacy considered  
✅ Success metrics clear  

**Next step:** Pick Week 1, start coding, and iterate.

**Remember:**
- Ship early, get feedback quickly
- Don't over-engineer (MVP mindset)
- Focus on core features only
- Real users reveal what works

---

*ShadowTalk Development Guide*  
*Version 1.0 - Created November 30, 2025*  
*Go build something amazing! 🚀*

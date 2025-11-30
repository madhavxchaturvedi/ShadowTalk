# 🌑 ShadowTalk

**An anonymous, real-time social network built with the MERN stack**

[![Production Ready](https://img.shields.io/badge/status-production%20ready-success)](PRODUCTION_READY.md)
[![Security](https://img.shields.io/badge/security-hardened-blue)](DEPLOYMENT_GUIDE.md#security)
[![Real-time](https://img.shields.io/badge/real--time-Socket.io-orange)](https://socket.io)

> Express yourself freely in the shadows. No registration, no tracking, just pure anonymous conversation.

---

## ✨ Features

### 🎭 **Anonymous by Design**
- Password-less authentication
- Random anonymous IDs (e.g., "ShadowUser_abc123")
- No email, no phone, no personal data
- Session-based JWT tokens

### 💬 **Real-time Communication**
- **Public Rooms**: Create and join topic-based chat rooms
- **Direct Messages**: Private 1-on-1 conversations
- **Instant Delivery**: Socket.io powered real-time messaging
- **Message Reactions**: Express yourself with 6 emoji reactions
- **Threaded Replies**: Organized conversations with nested replies

### 🛡️ **Safety & Moderation**
- **Content Filtering**: Automatic blocking of offensive keywords and spam
- **User Reporting**: Report inappropriate users or messages
- **User Blocking**: Block unwanted users from messaging you
- **Moderator Tools**: Review and manage reports
- **Reputation System**: Track user standing in the community

### 🎨 **User Experience**
- **Dark Theme**: Easy on the eyes, always
- **Optimistic UI**: Instant feedback on all actions
- **Auto-scroll**: Never miss a new message
- **Error Recovery**: Crash-proof with error boundaries
- **Mobile Responsive**: Works on all devices

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
\`\`\`bash
git clone https://github.com/madhavxchaturvedi/ShadowTalk.git
cd ShadowTalk
\`\`\`

2. **Set up Backend**
\`\`\`bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
\`\`\`

3. **Set up Frontend**
\`\`\`bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your backend URL
npm run dev
\`\`\`

4. **Open your browser**
\`\`\`
Frontend: http://localhost:5173
Backend:  http://localhost:3001
\`\`\`

---

## 📚 Documentation

- **[Production Ready Summary](PRODUCTION_READY.md)** - Overview of all features and production readiness
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Step-by-step deployment to Railway, Vercel, or VPS
- **[Testing Checklist](TESTING_CHECKLIST.md)** - Comprehensive manual testing guide
- **[Week 6-7: Moderation](WEEK_6-7_MODERATION.md)** - Details on moderation features

---

## 🏗️ Tech Stack

### Backend
- **Express.js** - Fast, unopinionated web framework
- **MongoDB + Mongoose** - NoSQL database with ODM
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Secure authentication tokens
- **Helmet** - Security headers
- **express-rate-limit** - DDoS protection
- **express-mongo-sanitize** - NoSQL injection prevention
- **compression** - Gzip compression

### Frontend
- **React 19** - UI library
- **Vite** - Fast build tool
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time connection
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first styling

---

## 🔐 Security Features

✅ **Helmet.js** - Security HTTP headers  
✅ **MongoDB Sanitization** - NoSQL injection prevention  
✅ **Rate Limiting** - 100 requests/15min per IP  
✅ **CORS Protection** - Whitelisted origins only  
✅ **Content Filtering** - Offensive keyword blocking  
✅ **JWT Authentication** - Secure session tokens  
✅ **Request Size Limits** - Max 10KB payloads  
✅ **Error Boundaries** - Crash recovery on frontend  

---

## 📊 Project Structure

\`\`\`
ShadowTalk/
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth, rate limiting, content filter
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   ├── server.js        # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route pages
│   │   ├── services/    # API and Socket.io
│   │   ├── store/       # Redux store
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
└── docs/                # Documentation files
\`\`\`

---

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/create-session` - Create anonymous session
- `POST /api/auth/join-session/:roomId` - Join room with session
- `POST /api/auth/rejoin-session` - Rejoin with existing token

### Rooms
- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create new room
- `POST /api/rooms/:roomId/join` - Join a room
- `POST /api/rooms/:roomId/leave` - Leave a room

### Messages
- `GET /api/messages/:roomId` - Get room messages
- `POST /api/messages/:roomId` - Send message
- `POST /api/messages/:messageId/react` - Add/remove reaction
- `POST /api/messages/:messageId/reply` - Reply to message

### Direct Messages
- `GET /api/dms/conversations` - List DM conversations
- `GET /api/dms/:userId` - Get DM history
- `POST /api/dms/:userId` - Send DM

### Users
- `GET /api/users/:userId` - Get user profile
- `POST /api/users/:userId/block` - Block user
- `POST /api/users/:userId/unblock` - Unblock user
- `GET /api/users/blocked/list` - Get blocked users

### Reports
- `POST /api/reports` - Submit report
- `GET /api/reports` - Get all reports (moderator)
- `PATCH /api/reports/:reportId` - Update report status

---

## 🧪 Testing

### Manual Testing
Use the comprehensive [Testing Checklist](TESTING_CHECKLIST.md)

### Test Real-time Features
1. Open 2 browser windows
2. Create session in both
3. Join same room
4. Send message from Window A
5. See it appear instantly in Window B ✅

### Test DMs
1. Get user ID from room message
2. Navigate to `/dm/{userId}`
3. Send message
4. Open same DM in another window
5. See messages appear bidirectionally ✅

---

## 🚀 Deployment

### Quick Deploy (5 minutes)

**Backend to Railway:**
\`\`\`bash
cd backend
railway login
railway init
railway up
\`\`\`

**Frontend to Vercel:**
\`\`\`bash
cd frontend
vercel --prod
\`\`\`

See [Full Deployment Guide](DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Ensure no console errors
5. Test real-time features thoroughly

---

## 📝 Environment Variables

### Backend (.env)
\`\`\`env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/shadowtalk
JWT_SECRET=your_secret_here
CORS_ORIGIN=http://localhost:5173
\`\`\`

### Frontend (.env)
\`\`\`env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
\`\`\`

---

## 🐛 Known Issues & Limitations

1. **Single Server**: Limited to ~1000 concurrent users
   - Scale with Redis adapter for Socket.io
2. **Text Only**: No file/image uploads yet
   - Add S3/Cloudinary integration
3. **Basic Content Filter**: Keyword-based only
   - Enhance with ML-based moderation

---

## 📈 Roadmap

### Version 2.0 (Future)
- [ ] Voice/video calls
- [ ] File attachments
- [ ] User avatars
- [ ] Advanced analytics
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Social login options
- [ ] Group DMs
- [ ] Message search
- [ ] Admin dashboard UI

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👨‍💻 Author

**Madhav Chaturvedi**
- GitHub: [@madhavxchaturvedi](https://github.com/madhavxchaturvedi)

---

## 🙏 Acknowledgments

- Socket.io for real-time magic
- MongoDB for flexible data storage
- React team for amazing frontend tools
- Vite for blazing fast builds
- The open-source community

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ and ☕**  
*Making anonymous communication safe and enjoyable*


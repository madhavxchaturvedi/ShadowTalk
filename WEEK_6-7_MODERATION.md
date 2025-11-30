# Week 6-7: Moderation & Safety - Implementation Complete ✅

## Overview
Added comprehensive content moderation and user safety features to ShadowTalk, including reporting system, automatic content filtering, and user blocking capabilities.

---

## 🎯 Features Implemented

### 1. **Report System**

#### Backend - Report Model (`/backend/models/Report.js`)
- Schema with comprehensive tracking:
  - `reporter` - User who submitted the report
  - `reportedUser` - User being reported
  - `reportedMessage` - Optional message reference (supports Message and PrivateMessage)
  - `reason` - Enum: spam, harassment, hate_speech, inappropriate_content, impersonation, other
  - `description` - Optional 500 char details
  - `status` - pending, reviewed, resolved, dismissed
  - `reviewedBy` - Moderator who reviewed
  - `moderatorNotes` - Internal notes (max 1000 chars)
- Indexed for efficient queries on status, reportedUser, and reporter

#### Backend - Report Routes (`/backend/routes/reports.js`)
- **POST /api/reports** - Submit a report
  - Validates required fields
  - Prevents self-reporting
  - Returns reportId on success
  
- **GET /api/reports** - Get all reports (for moderators)
  - Query params: `status`, `limit`, `skip`
  - Populates all referenced users and messages
  - Returns paginated results with total count
  
- **GET /api/reports/my-reports** - Get user's submitted reports
  - Shows last 20 reports
  - Sorted by newest first
  
- **PATCH /api/reports/:reportId** - Update report status (moderators)
  - Updates status (reviewed/resolved/dismissed)
  - Records reviewer and timestamp
  - Supports moderator notes

---

### 2. **Content Filtering**

#### Keyword Filter Middleware (`/backend/middleware/contentFilter.js`)
- **Banned keywords** - Filters offensive language and hate speech
- **Spam detection**:
  - Excessive caps (>70% uppercase in 10+ char messages)
  - Repeated characters (4+ same character in a row)
  - Spam phrases ("buy now", "click here", etc.)
  
- **Response**: Returns 400 with specific error:
  - `error`: User-friendly message
  - `reason`: Category (inappropriate_content/spam)
  - `detail`: What was detected

#### Applied to Routes
- ✅ POST /api/messages/:roomId (room messages)
- ✅ POST /api/dms/:userId (direct messages)

---

### 3. **User Blocking**

#### Backend - User Model Updates
- Added `blockedUsers` array field (array of User ObjectIds)
- Allows users to maintain their own block list

#### Backend - Block Routes (`/backend/routes/users.js`)
- **POST /api/users/:userId/block** - Block a user
  - Validates user exists
  - Prevents self-blocking
  - Checks if already blocked
  - Adds to blockedUsers array
  
- **POST /api/users/:userId/unblock** - Unblock a user
  - Checks if user is blocked
  - Removes from blockedUsers array
  
- **GET /api/users/blocked/list** - Get blocked users
  - Returns full list with user details
  - Populates anonymousId and reputation

#### DM Blocking Enforcement
- Updated `/backend/routes/dms.js` POST route
- Checks if sender or receiver has blocked the other
- Returns 403 if blocked in either direction
- Error: "Cannot send message to this user"

---

### 4. **Frontend Components**

#### Report Modal (`/frontend/src/components/ReportModal.jsx`)
- Beautiful modal UI with:
  - Reason dropdown (6 predefined reasons)
  - Optional description textarea (500 char limit)
  - Character counter
  - Loading states
  - Error handling
- Props:
  - `isOpen` - Controls visibility
  - `onClose` - Close callback
  - `reportedUserId` - User being reported
  - `reportedMessageId` - Optional message
  - `messageType` - 'Message' or 'PrivateMessage'
  - `reportedUserName` - Display name

#### DirectMessage Updates
- **Report Button** in header
  - 🚨 Report icon
  - Opens ReportModal
  - Reports the other user in conversation
  
- **Block/Unblock Button** in header
  - Shows 🚫 Block (red) when not blocked
  - Shows ✓ Unblock (green) when blocked
  - Confirmation dialogs for both actions
  - Updates state on success
  - Error handling with alerts
  
- **State Management**:
  - `isBlocked` - Tracks block status
  - `showReportModal` - Controls modal visibility

---

## 📁 Files Changed/Created

### Backend
- ✅ **Created** `/backend/models/Report.js`
- ✅ **Created** `/backend/routes/reports.js`
- ✅ **Created** `/backend/middleware/contentFilter.js`
- ✅ **Modified** `/backend/routes/users.js` (added block/unblock/list endpoints)
- ✅ **Modified** `/backend/routes/messages.js` (added contentFilter middleware)
- ✅ **Modified** `/backend/routes/dms.js` (added contentFilter middleware)
- ✅ **Modified** `/backend/server.js` (added reportRoutes)
- ✅ **Modified** `/backend/models/User.js` (already had blockedUsers field)

### Frontend
- ✅ **Created** `/frontend/src/components/ReportModal.jsx`
- ✅ **Modified** `/frontend/src/pages/DirectMessage.jsx` (added Report & Block buttons)

---

## 🧪 Testing Instructions

### Test 1: Content Filtering
1. Send a message with banned words (e.g., "fuck", "shit")
2. **Expected**: Gets 400 error, message not sent
3. **Error shown**: "Your message contains inappropriate content or spam"
4. Try excessive caps: "HEYYYYYY EVERYONE!!!"
5. **Expected**: Rejected as spam

### Test 2: User Reporting
1. In DM, click "🚨 Report" button
2. Select reason from dropdown
3. Add optional description
4. Click "Submit Report"
5. **Expected**: 
   - Success message shown
   - Modal closes
   - Report saved in database

### Test 3: User Blocking
1. In DM with another user, click "🚫 Block"
2. Confirm the dialog
3. **Expected**:
   - Button changes to "✓ Unblock" (green)
   - Alert: "User blocked"
4. Try to send a message
5. **Expected**: 403 error "Cannot send message to this user"
6. Have the blocked user try to send you a message
7. **Expected**: Their message also blocked (bidirectional)

### Test 4: Unblocking
1. Click "✓ Unblock" button
2. Confirm the dialog
3. **Expected**:
   - Button changes to "🚫 Block" (red)
   - Alert: "User unblocked"
4. Try sending a message
5. **Expected**: Message sends successfully

### Test 5: View Reports (Moderator)
1. Use Postman/curl to GET `/api/reports`
2. Add auth token header
3. **Expected**: Returns all reports with:
   - Reporter info
   - Reported user info
   - Reason and description
   - Status (pending by default)
   - Timestamps

### Test 6: Update Report Status (Moderator)
1. Use Postman/curl to PATCH `/api/reports/:reportId`
2. Body: `{ "status": "reviewed", "moderatorNotes": "Investigated and resolved" }`
3. **Expected**: Report updated with:
   - New status
   - ReviewedBy set to current user
   - ReviewedAt timestamp
   - Moderator notes saved

---

## 🔐 Security Features

✅ **Prevent self-actions**:
- Cannot report yourself
- Cannot block yourself

✅ **Bidirectional blocking**:
- If A blocks B, neither can message each other
- Checked on both sender and receiver side

✅ **Input validation**:
- Content filtering on all user messages
- Character limits enforced
- Required fields validated

✅ **Authorization**:
- All routes require authentication
- User can only see their own submitted reports
- Moderator actions tracked with userId

---

## 📊 Database Impact

### New Collections
- **reports** - Stores all user reports

### Modified Collections
- **users** - Already had blockedUsers field

### Indexes Added
- Reports: status + createdAt (compound)
- Reports: reportedUser (single)
- Reports: reporter (single)

---

## 🚀 API Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/reports` | Submit a report | ✅ |
| GET | `/api/reports` | Get all reports (moderator) | ✅ |
| GET | `/api/reports/my-reports` | Get user's reports | ✅ |
| PATCH | `/api/reports/:reportId` | Update report status | ✅ |
| POST | `/api/users/:userId/block` | Block a user | ✅ |
| POST | `/api/users/:userId/unblock` | Unblock a user | ✅ |
| GET | `/api/users/blocked/list` | Get blocked users | ✅ |

---

## 🎨 UI Elements Added

| Component | Location | Features |
|-----------|----------|----------|
| Report Button | DM Header | Opens report modal, shows 🚨 icon |
| Block Button | DM Header | Toggles block/unblock, shows 🚫/✓ |
| ReportModal | Global Component | 6 reasons, description, validation |

---

## 💡 Future Enhancements (Optional)

- [ ] Add Report button to individual room messages
- [ ] Create moderator dashboard page
- [ ] Add reputation penalties for reported users
- [ ] Email notifications for report status updates
- [ ] Auto-ban users after X reports
- [ ] Appeal system for blocked users
- [ ] Configurable keyword list via admin panel
- [ ] Machine learning for content detection
- [ ] User mute (hide messages without blocking)

---

## ✅ Week 6-7 Checklist

- [x] Report model and routes
- [x] Content filtering middleware
- [x] User blocking endpoints
- [x] Block enforcement in DMs
- [x] Report modal UI
- [x] Block/Unblock buttons in DMs
- [x] Testing documentation

**Status**: ✅ **COMPLETE**

---

## 📝 Notes

- Content filter uses basic keyword matching (can be enhanced with regex/ML)
- Blocking is bidirectional and immediate
- All moderation actions are logged with timestamps
- Reports are pending by default and require moderator review
- Frontend uses native confirm() dialogs (can be replaced with custom modals)

**Next**: Week 8 - Testing & Deployment

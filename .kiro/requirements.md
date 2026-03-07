# Continuum Messenger - Requirements Document

## Project Overview

Continuum Messenger is a real-time chat application built on Firebase (Firestore + Auth) that allows users to connect with friends and family through a clean, modern interface. The app leverages the Continuum Client Processor Library for chat state management and plugin-based features.

At P0, only 1-1 chat conversations will be supported. Group chats will be P1+ feature. 

## Target Users

- Friends and family (< 20 people)
- Infrequent usage pattern
- Users comfortable with Google authentication

## Functional Requirements

### P0 (Must Have - Initial Release)

#### 1. Authentication & User Management

**FR-1.1: Google Sign-In**
- Users can sign in using their Google account
- First-time users are prompted to create a unique username
- Username must be 3-20 characters, alphanumeric with underscores allowed

**FR-1.2: Username Creation & Validation**
- During signup, users enter a desired username as well as a display name (first and last name)
- "Check Availability" button validates username uniqueness in real-time
- Visual text feedback shows if username is available or taken
- Username may be able to be changed infrequently after creation

**FR-1.3: User Profile**
- Display user initials as avatar (generated from display name)
- Store: uid (Firebase Auth), username (unique), displayName, email, createdAt

**FR-1.4: Logout**
- Logout button in top-right corner
- Clears session and returns to login screen

#### 2. Friend Management

**FR-2.1: Add Friend**
- "Add New Friend" button at top of left sidebar
- Modal popup with username input field
- Search for friend by exact username match
- Send friend request to found user

**FR-2.2: Friend Request Flow - Sender**
- After sending request, new chat appears in sender's chat list
- System message: "Friend request sent"
- Chat is in "pending" state (sender cannot send messages yet)

**FR-2.3: Friend Request Flow - Receiver**
- Notification icon in top-left of sidebar shows count of pending requests
- Clicking notification shows list of pending friend requests
- Each request shows: username, display name, timestamp
- Two action buttons: Accept (green checkmark) and Deny (red X)

**FR-2.4: Accept Friend Request**
- Chat appears in receiver's chat list
- System message: "Start of chat with [username]"
- Both users can now send/receive messages in real-time
- Notification count decrements

**FR-2.5: Deny Friend Request**
- Chat disappears from receiver's view
- Sender's chat remains but shows system message: "Friend request declined"
- Sender can send another request in the future

#### 3. Chat List (Left Sidebar)

**FR-3.1: Chat List Display**
- Shows all active chats (accepted friends)
- Each chat item displays:
  - Friend's initials avatar
  - Friend's display name
  - Last message preview (truncated to 40 chars)
  - Timestamp of last message (relative: "2m ago", "1h ago", "Yesterday", "MM/DD/YY")
  - Unread message count badge (if any)

**FR-3.2: Chat List Ordering**
- Chats sorted by most recent message timestamp (descending)
- Active/selected chat highlighted

**FR-3.3: Chat Selection**
- Clicking a chat loads the conversation in main area
- Loads most recent 20 messages initially

#### 4. Real-Time Messaging

**FR-4.1: Send Message**
- Text input at bottom of chat area
- Send button (paper plane icon)
- Enter key sends message
- Message appears immediately (optimistic update)

**FR-4.2: Receive Message**
- Real-time updates via Firestore listeners
- New messages appear without page refresh
- Unread count updates in chat list
- Auto-scroll to bottom when new message arrives (if already at bottom)

**FR-4.3: Message Display**
- Own messages: right-aligned, blue bubble
- Friend's messages: left-aligned, gray bubble
- Each message shows: content, timestamp, author
- System messages: centered, gray text, no bubble

**FR-4.4: Message History**
- Load most recent 20 messages on chat open
- Infinite scroll: load 20 more messages when scrolling to top
- Loading indicator while fetching older messages

**FR-4.5: Message Timestamps**
- Hover over message to see full timestamp
- Display relative time for recent messages

#### 5. Message Features (from Continuum Playground)

**FR-5.1: Edit Message**
- Three-dot menu on own messages
- "Edit" option opens inline editor
- Save/Cancel buttons
- Edited messages show "Edited" indicator
- Click "Edited" to view edit history
- Edit history shows previous versions with timestamps

**FR-5.2: Delete Message**
- Three-dot menu on own messages
- "Delete" option with confirmation
- Deleted messages show "Message deleted" placeholder
- Cannot be undone

**FR-5.3: Reply to Message**
- Reply button appears on hover (any message)
- Clicking reply shows preview banner (of message being replied to) above input
- Sent reply displays quoted message above
- Text: "You replied to [username]" or "You replied to yourself"

#### 6. UI/UX

**FR-6.1: Layout**
- Left sidebar: 300px width (or use relative width), chat list
- Main area: selected chat conversation
- Top bar: app title, user info, logout button
- Responsive design (mobile-friendly)

**FR-6.2: Color Scheme**
- Maintain Continuum Playground gradient theme
- Background: purple-to-pink gradient
- Chat area: white background
- Accent colors: blue (own messages), gray (friend messages)

**FR-6.3: Loading States**
- Skeleton loaders for chat list
- Loading spinner for messages
- Disabled states for buttons during operations

**FR-6.4: Error Handling**
- Toast notifications for errors
- Graceful degradation if offline
- Retry mechanisms for failed operations

### P1 (Nice to Have - Future Releases)

#### 7. Enhanced Features

**FR-7.1: Online Status**
- Green dot indicator for online friends
- "Last seen" timestamp for offline friends
- Presence detection via Firebase Realtime Database

**FR-7.2: Profile Pictures**
- Upload custom avatar image
- Image stored in Firebase Storage
- Fallback to initials if no image

**FR-7.3: Emoji Reactions**
- React to messages with emojis
- Display reactions below message
- Multiple users can react with same emoji (count shown)

**FR-7.4: Typing Indicators**
- "Friend is typing..." indicator
- Real-time updates via Firestore

**FR-7.5: Message Search**
- Search within conversation
- Highlight matching text
- Jump to message in history

**FR-7.6: Read Receipts**
- Show when friend has read messages
- Blue checkmarks for read messages

**FR-7.7: Username Change**
- Allow users to change username (with cooldown period)
- Update across all chats

## Non-Functional Requirements

### NFR-1: Performance
- Messages load within 500ms
- Real-time updates appear within 1 second
- Smooth scrolling with 60fps

### NFR-2: Security
- Firebase Security Rules enforce data access
- Users can only read/write their own chats
- Username uniqueness enforced at database level
- Users can only log in to their own accounts via Google auth 

### NFR-3: Scalability
- Support up to 7 concurrent users (P0)
- Firestore free tier limits: 50K reads/day, 20K writes/day
- Optimize queries to minimize reads

### NFR-4: Reliability
- 99% uptime (Firebase SLA)
- Offline support: queue messages when offline
- Automatic reconnection on network restore

### NFR-5: Usability
- Intuitive UI requiring no tutorial
- Keyboard shortcuts (Enter to send, Esc to cancel)
- Accessible (WCAG 2.1 AA compliance goal)

### NFR-6: Maintainability
- Clean separation: UI components, Firebase services, Continuum library
- TypeScript for type safety
- Comprehensive error logging

## Technical Constraints

- **Frontend**: React 19, Vite, TailwindCSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Chat Engine**: Continuum Client Processor Library
- **Deployment**: Firebase Hosting
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)

## Success Metrics

- All 7 target users successfully onboard
- Average message delivery time < 1 second
- Zero data loss incidents
- Positive user feedback on UX

## Out of Scope (P0)

- Group chats (3+ people)
- Voice/video calls
- File sharing (images, documents)
- Message encryption (end-to-end)
- Mobile native apps (iOS/Android)
- Push notifications
- Message forwarding
- Chat export/backup

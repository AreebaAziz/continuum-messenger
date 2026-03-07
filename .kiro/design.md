# Continuum Messenger - Design Document

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                    │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  UI Components │  │ Firebase SDK │  │ Continuum Lib   │ │
│  │  - Auth        │  │ - Auth       │  │ - useContinuum  │ │
│  │  - ChatList    │  │ - Firestore  │  │   Chat          │ │
│  │  - ChatWindow  │  │ - Storage    │  │ - Plugins       │ │
│  │  - Messages    │  │              │  │ - Event System  │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Firebase Backend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Firebase     │  │  Firestore   │  │ Firebase Storage │  │
│  │ Auth         │  │  Database    │  │ (P1 - avatars)   │  │
│  │ - Google     │  │  - users     │  │                  │  │
│  │   Sign-In    │  │  - chats     │  │                  │  │
│  │              │  │  - messages  │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

**Frontend:**
- React 19.1.1 (UI framework)
- Vite 7.1.7 (build tool)
- TailwindCSS 4.1.16 (styling)
- Lucide React (icons)
- Firebase SDK 10.x (client library)
- Continuum Client Processor Library (chat engine)

**Backend:**
- Firebase Authentication (Google OAuth)
- Cloud Firestore (NoSQL database)
- Firebase Storage (P1 - profile pictures)
- Firebase Hosting (deployment)

**Development:**
- TypeScript (type safety)
- ESLint (code quality)

## 2. Data Model

### 2.1 Firestore Collections

#### Collection: `users`
```typescript
interface User {
  uid: string;              // Firebase Auth UID (document ID)
  username: string;         // Unique username (indexed)
  displayName: string;      // Full name (First Last)
  email: string;            // From Google Auth
  photoURL?: string;        // P1 - custom avatar URL
  createdAt: Timestamp;
  lastSeen: Timestamp;      // P1 - for online status
  isOnline: boolean;        // P1 - presence
}
```


**Indexes:**
- `username` (unique, for lookup)
- `email` (for auth mapping)

#### Collection: `chats`
```typescript
interface Chat {
  id: string;                    // Auto-generated document ID
  participants: string[];        // Array of 2 UIDs [uid1, uid2]
  participantDetails: {          // Denormalized for quick access
    [uid: string]: {
      username: string;
      displayName: string;
      photoURL?: string;
    }
  };
  status: 'pending' | 'active' | 'declined';
  initiatorUid: string;          // Who sent the friend request
  createdAt: Timestamp;
  lastMessageAt: Timestamp;      // For sorting chat list
  lastMessage: {                 // Denormalized for preview
    content: string;
    authorUid: string;
    timestamp: Timestamp;
    type: string;                // 'message' | 'system'
  };
  unreadCount: {                 // Per-user unread counts
    [uid: string]: number;
  };
}
```

**Indexes:**
- Composite: `participants` (array-contains) + `lastMessageAt` (desc)
- Composite: `participants` (array-contains) + `status` + `lastMessageAt` (desc)

#### Collection: `chats/{chatId}/messages`
```typescript
interface Message {
  id: string;                    // Auto-generated document ID
  chatId: string;                // Parent chat ID
  authorUid: string;
  authorUsername: string;        // Denormalized
  authorDisplayName: string;     // Denormalized
  content: string;
  type: string;                  // Flexible string for extensibility
                                 // Common types: 'message', 'system', 'deletedMessage'
                                 // Future: 'poll', 'announcement', etc.
  timestamp: Timestamp;
  props?: {                      // Feature-specific metadata
    // Edit feature
    editedAt?: Timestamp;
    editHistory?: string[];      // Previous versions
    
    // Reply feature
    replyToMessageId?: string;
    replyToContent?: string;
    replyToAuthorUid?: string;
    replyToAuthorDisplayName?: string;
    
    // Reactions feature (P1)
    reactions?: {
      [emoji: string]: string[]; // Array of UIDs who reacted
    };
    
    // Future features can add more props
    // e.g., poll options, file attachments, etc.
  };
}
```

**Indexes:**
- `chatId` + `timestamp` (desc) - for pagination
- `chatId` + `type` + `timestamp` (desc) - for filtering

#### Collection: `friendRequests`
```typescript
interface FriendRequest {
  id: string;                    // Auto-generated
  fromUid: string;               // Sender
  toUid: string;                 // Receiver
  fromUsername: string;          // Denormalized
  fromDisplayName: string;       // Denormalized
  status: 'pending' | 'accepted' | 'declined';
  chatId: string;                // Associated chat ID
  createdAt: Timestamp;
  respondedAt?: Timestamp;
}
```

**Indexes:**
- `toUid` + `status` + `createdAt` (desc)
- `fromUid` + `toUid` (for duplicate prevention)

### 2.2 Data Denormalization Strategy

To minimize Firestore reads and improve performance:

1. **Chat List**: Store last message details in `chats` collection
2. **User Info**: Store username/displayName in messages for display
3. **Unread Counts**: Maintain per-user counts in `chats` document

**Trade-off**: Increased write complexity for faster reads (acceptable for low-volume app)

## 3. Frontend Architecture

### 3.1 Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── AuthGuard
│       ├── LoginPage
│       │   ├── GoogleSignInButton
│       │   └── UsernameSetup
│       │       └── UsernameInput (with availability check)
│       └── MainApp
│           ├── TopBar
│           │   ├── AppTitle
│           │   ├── UserProfile
│           │   └── LogoutButton
│           ├── Sidebar
│           │   ├── FriendRequestNotification
│           │   ├── AddFriendButton
│           │   └── ChatList
│           │       └── ChatListItem[]
│           └── ChatWindow
│               ├── ChatHeader
│               ├── MessageList
│               │   ├── SystemMessage
│               │   ├── MessageBubble
│               │   │   ├── ReplyPreview
│               │   │   ├── MessageContent
│               │   │   ├── EditHistory
│               │   │   └── MessageActions (edit/delete/reply)
│               │   └── LoadMoreIndicator
│               └── MessageInput
│                   ├── ReplyBanner
│                   ├── TextInput
│                   └── SendButton
├── AddFriendModal
│   ├── UsernameSearch
│   └── SendRequestButton
└── FriendRequestsModal
    └── FriendRequestItem[]
        ├── AcceptButton
        └── DeclineButton
```

### 3.2 State Management

**Global State (React Context):**
- `AuthContext`: Current user, auth status
- `ChatContext`: Active chat, chat list, unread counts

**Local State (Component):**
- UI state (modals, menus, hover states)
- Form inputs
- Loading/error states

**Server State (Firebase Listeners):**
- Real-time chat updates
- Message streams
- Friend request notifications

### 3.3 Key React Hooks

```typescript
// Custom hooks
useAuth()              // Auth state and methods
useChatList()          // Subscribe to user's chats
useMessages(chatId)    // Subscribe to chat messages
useFriendRequests()    // Subscribe to pending requests
usePresence(uid)       // P1 - online status
```


### 3.4 Integration with Continuum Library

The Continuum Client Processor Library will be integrated as follows:

```typescript
// In ChatWindow component
const {
  onInitialMessagesLoaded,
  onMessagesDiff,
  onNewEvent,
  messages,
} = useContinuumChat({
  plugins: [
    EditMessagePlugin,
    DeleteMessagePlugin,
    // Future: ReactionsPlugin, TypingIndicatorPlugin
  ]
});

// Load initial messages from Firestore
useEffect(() => {
  const unsubscribe = subscribeToMessages(chatId, (firestoreMessages) => {
    const continuumMessages = firestoreMessages.map(convertToMessage);
    onInitialMessagesLoaded(continuumMessages);
  });
  return unsubscribe;
}, [chatId]);

// Listen for new messages
useEffect(() => {
  const unsubscribe = subscribeToNewMessages(chatId, (newMessages) => {
    onMessagesDiff({ add: newMessages });
  });
  return unsubscribe;
}, [chatId]);

// Send new message
const sendMessage = (content: string) => {
  const event: Event = {
    author: { uid: currentUser.uid, displayName: currentUser.displayName },
    action: CoreAction.sendMessage,
    content,
  };
  onNewEvent(event);
  
  // Persist to Firestore
  await addMessageToFirestore(chatId, event);
};
```

**Benefits:**
- Consistent message state management
- Plugin-based features (edit, delete, reply)
- Optimistic updates
- Easy to extend with new features

## 4. Backend Design (Firebase)

### 4.1 Firebase Authentication Flow

```
1. User clicks "Sign in with Google"
2. Firebase Auth popup opens
3. User selects Google account
4. Firebase returns user credentials (uid, email, displayName, photoURL)
5. Check if user exists in Firestore `users` collection
   - If exists: Load user data, redirect to main app
   - If new: Show username setup screen
6. User enters username and display name
7. Click "Check Availability" → Query Firestore for username
8. If available, create user document
9. Redirect to main app
```

### 4.2 Friend Request Flow

**Sending Request:**
```
1. User clicks "Add New Friend"
2. Modal opens with username input
3. User enters friend's username
4. Query Firestore `users` collection for username
5. If found:
   a. Check if chat already exists between users
   b. If not, create:
      - New `chat` document (status: 'pending')
      - New `friendRequest` document
      - System message: "Friend request sent"
6. If not found: Show error "User not found"
```

**Receiving Request:**
```
1. Real-time listener on `friendRequests` where toUid == currentUser.uid
2. Update notification badge count
3. User clicks notification icon
4. Modal shows list of pending requests
5. User clicks Accept or Decline
```

**Accepting Request:**
```
1. Update `chat` status to 'active'
2. Update `friendRequest` status to 'accepted'
3. Add system message: "Start of chat with [username]"
4. Both users can now send messages
```

**Declining Request:**
```
1. Update `chat` status to 'declined'
2. Update `friendRequest` status to 'declined'
3. Chat hidden from receiver's view
4. Sender sees system message: "Friend request declined"
```

### 4.3 Real-Time Messaging Flow

**Sending Message:**
```
1. User types message and clicks Send
2. Optimistic update: Add message to local state immediately
3. Write to Firestore:
   - Add document to `chats/{chatId}/messages`
   - Update `chats/{chatId}`:
     - lastMessage
     - lastMessageAt
     - Increment unreadCount for other participant
4. If write fails: Show error, remove optimistic message
```

**Receiving Message:**
```
1. Firestore listener detects new message
2. onMessagesDiff({ add: [newMessage] })
3. Update chat list (move to top, update preview)
4. If chat is active: Mark as read, decrement unreadCount
5. If chat is not active: Increment unread badge
```

### 4.4 Message Editing Flow

```
1. User clicks Edit on their message
2. Inline editor appears
3. User modifies text and clicks Save
4. onNewEvent({ action: 'editMessage', props: { messageId, newContent } })
5. EditMessagePlugin updates local state
6. Write to Firestore:
   - Update message document:
     - content = newContent
     - editedAt = now
     - editHistory.push(oldContent)
   - Update chat.lastMessage if this was the last message
7. Real-time listener propagates change to other user
```

### 4.5 Message Deletion Flow

```
1. User clicks Delete on their message
2. Confirmation dialog (optional)
3. onNewEvent({ action: 'deleteMessage', props: { messageId } })
4. DeleteMessagePlugin updates local state (type: 'deletedMessage')
5. Write to Firestore:
   - Update message document:
     - type = 'deletedMessage'
     - content = ''
     - props = {}
6. Real-time listener propagates change to other user
```

### 4.6 Infinite Scroll (Load Older Messages)

```
1. User scrolls to top of message list
2. Detect scroll position (< 100px from top)
3. Query Firestore:
   - Collection: chats/{chatId}/messages
   - Where: timestamp < oldestLoadedMessage.timestamp
   - OrderBy: timestamp desc
   - Limit: 20
4. onMessagesDiff({ add: olderMessages })
5. Maintain scroll position (prevent jump)
6. Show loading indicator while fetching
```


## 5. Firebase Security Rules

### 5.1 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return request.auth.uid == uid;
    }
    
    function isChatParticipant(chatData) {
      return request.auth.uid in chatData.participants;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone can read user profiles (for friend search)
      allow read: if isAuthenticated();
      
      // Users can only create/update their own profile
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      
      // No deletes
      allow delete: if false;
    }
    
    // Chats collection
    match /chats/{chatId} {
      // Can read if you're a participant
      allow read: if isAuthenticated() && 
                     isChatParticipant(resource.data);
      
      // Can create if you're one of the participants
      allow create: if isAuthenticated() && 
                       request.auth.uid in request.resource.data.participants;
      
      // Can update if you're a participant (for unread counts, last message)
      allow update: if isAuthenticated() && 
                       isChatParticipant(resource.data);
      
      // No deletes
      allow delete: if false;
      
      // Messages subcollection
      match /messages/{messageId} {
        // Can read if you're a chat participant
        allow read: if isAuthenticated() && 
                       isChatParticipant(get(/databases/$(database)/documents/chats/$(chatId)).data);
        
        // Can create if you're a chat participant and author
        allow create: if isAuthenticated() && 
                         isChatParticipant(get(/databases/$(database)/documents/chats/$(chatId)).data) &&
                         request.auth.uid == request.resource.data.authorUid;
        
        // Can update only your own messages (for edits/deletes)
        allow update: if isAuthenticated() && 
                         isOwner(resource.data.authorUid);
        
        // No deletes (soft delete only)
        allow delete: if false;
      }
    }
    
    // Friend requests collection
    match /friendRequests/{requestId} {
      // Can read if you're sender or receiver
      allow read: if isAuthenticated() && 
                     (isOwner(resource.data.fromUid) || 
                      isOwner(resource.data.toUid));
      
      // Can create if you're the sender
      allow create: if isAuthenticated() && 
                       isOwner(request.resource.data.fromUid);
      
      // Can update if you're the receiver (to accept/decline)
      allow update: if isAuthenticated() && 
                       isOwner(resource.data.toUid);
      
      // No deletes
      allow delete: if false;
    }
  }
}
```

### 5.2 Firebase Storage Rules (P1)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures
    match /avatars/{userId}/{fileName} {
      // Can read anyone's avatar
      allow read: if request.auth != null;
      
      // Can only upload to your own folder
      allow write: if request.auth != null && 
                      request.auth.uid == userId &&
                      request.resource.size < 5 * 1024 * 1024 && // 5MB max
                      request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 6. API Design (Firebase Service Layer)

### 6.1 Authentication Service

```typescript
// src/services/authService.ts

export const authService = {
  // Sign in with Google
  signInWithGoogle: async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  },
  
  // Check if user has completed setup
  checkUserSetup: async (uid: string): Promise<boolean> => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists();
  },
  
  // Create user profile
  createUserProfile: async (userData: {
    uid: string;
    username: string;
    displayName: string;
    email: string;
  }): Promise<void> => {
    await setDoc(doc(db, 'users', userData.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      isOnline: false,
    });
  },
  
  // Check username availability
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    const q = query(
      collection(db, 'users'),
      where('username', '==', username),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty;
  },
  
  // Sign out
  signOut: async (): Promise<void> => {
    await signOut(auth);
  },
};
```

### 6.2 Chat Service

```typescript
// src/services/chatService.ts

export const chatService = {
  // Get user's chats
  subscribeToChats: (
    uid: string,
    callback: (chats: Chat[]) => void
  ): Unsubscribe => {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', uid),
      where('status', 'in', ['pending', 'active']),
      orderBy('lastMessageAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Chat));
      callback(chats);
    });
  },
  
  // Get chat by participants
  getChatByParticipants: async (
    uid1: string,
    uid2: string
  ): Promise<Chat | null> => {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', uid1)
    );
    const snapshot = await getDocs(q);
    
    const chat = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(uid2);
    });
    
    return chat ? { id: chat.id, ...chat.data() } as Chat : null;
  },
  
  // Create new chat (friend request)
  createChat: async (
    fromUser: User,
    toUser: User
  ): Promise<string> => {
    const chatRef = doc(collection(db, 'chats'));
    const chatId = chatRef.id;
    
    await setDoc(chatRef, {
      participants: [fromUser.uid, toUser.uid],
      participantDetails: {
        [fromUser.uid]: {
          username: fromUser.username,
          displayName: fromUser.displayName,
        },
        [toUser.uid]: {
          username: toUser.username,
          displayName: toUser.displayName,
        },
      },
      status: 'pending',
      initiatorUid: fromUser.uid,
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      lastMessage: {
        content: 'Friend request sent',
        authorUid: 'system',
        timestamp: serverTimestamp(),
        type: 'system',
      },
      unreadCount: {
        [fromUser.uid]: 0,
        [toUser.uid]: 1,
      },
    });
    
    return chatId;
  },
  
  // Accept friend request
  acceptFriendRequest: async (
    chatId: string,
    requestId: string
  ): Promise<void> => {
    const batch = writeBatch(db);
    
    // Update chat status
    batch.update(doc(db, 'chats', chatId), {
      status: 'active',
    });
    
    // Update friend request
    batch.update(doc(db, 'friendRequests', requestId), {
      status: 'accepted',
      respondedAt: serverTimestamp(),
    });
    
    await batch.commit();
  },
  
  // Decline friend request
  declineFriendRequest: async (
    chatId: string,
    requestId: string
  ): Promise<void> => {
    const batch = writeBatch(db);
    
    batch.update(doc(db, 'chats', chatId), {
      status: 'declined',
    });
    
    batch.update(doc(db, 'friendRequests', requestId), {
      status: 'declined',
      respondedAt: serverTimestamp(),
    });
    
    await batch.commit();
  },
  
  // Mark chat as read
  markChatAsRead: async (chatId: string, uid: string): Promise<void> => {
    await updateDoc(doc(db, 'chats', chatId), {
      [`unreadCount.${uid}`]: 0,
    });
  },
};
```


### 6.3 Message Service

```typescript
// src/services/messageService.ts

export const messageService = {
  // Subscribe to messages
  subscribeToMessages: (
    chatId: string,
    limit: number,
    callback: (messages: Message[]) => void
  ): Unsubscribe => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Message))
        .reverse(); // Reverse to show oldest first
      callback(messages);
    });
  },
  
  // Load older messages (pagination)
  loadOlderMessages: async (
    chatId: string,
    beforeTimestamp: Timestamp,
    limit: number
  ): Promise<Message[]> => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      where('timestamp', '<', beforeTimestamp),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Message))
      .reverse();
  },
  
  // Send message
  sendMessage: async (
    chatId: string,
    message: {
      authorUid: string;
      authorUsername: string;
      authorDisplayName: string;
      content: string;
      type?: string;
      replyTo?: any;
    }
  ): Promise<string> => {
    const batch = writeBatch(db);
    
    // Add message
    const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
    batch.set(messageRef, {
      ...message,
      type: message.type || 'message',
      timestamp: serverTimestamp(),
    });
    
    // Update chat's last message
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    const chatData = chatSnap.data() as Chat;
    
    const otherParticipantUid = chatData.participants.find(
      uid => uid !== message.authorUid
    );
    
    batch.update(chatRef, {
      lastMessage: {
        content: message.content,
        authorUid: message.authorUid,
        timestamp: serverTimestamp(),
        type: message.type || 'message',
      },
      lastMessageAt: serverTimestamp(),
      [`unreadCount.${otherParticipantUid}`]: increment(1),
    });
    
    await batch.commit();
    return messageRef.id;
  },
  
  // Edit message
  editMessage: async (
    chatId: string,
    messageId: string,
    newContent: string,
    oldContent: string
  ): Promise<void> => {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();
    
    await updateDoc(messageRef, {
      content: newContent,
      editedAt: serverTimestamp(),
      editHistory: arrayUnion(oldContent),
    });
    
    // Update chat's last message if this was the last message
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    const chatData = chatSnap.data() as Chat;
    
    if (chatData.lastMessage.authorUid === messageData?.authorUid) {
      await updateDoc(chatRef, {
        'lastMessage.content': newContent,
      });
    }
  },
  
  // Delete message
  deleteMessage: async (
    chatId: string,
    messageId: string
  ): Promise<void> => {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    
    await updateDoc(messageRef, {
      type: 'deletedMessage',
      content: '',
      props: {},
    });
    
    // Update chat's last message if this was the last message
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    const chatData = chatSnap.data() as Chat;
    
    // If deleted message was last message, update preview
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const messagesSnap = await getDocs(messagesQuery);
    
    if (!messagesSnap.empty) {
      const lastMessage = messagesSnap.docs[0].data();
      await updateDoc(chatRef, {
        lastMessage: {
          content: lastMessage.type === 'deletedMessage' 
            ? 'Message deleted' 
            : lastMessage.content,
          authorUid: lastMessage.authorUid,
          timestamp: lastMessage.timestamp,
          type: lastMessage.type,
        },
      });
    }
  },
  
  // Send system message
  sendSystemMessage: async (
    chatId: string,
    content: string
  ): Promise<void> => {
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      authorUid: 'system',
      authorUsername: 'System',
      authorDisplayName: 'System',
      content,
      type: 'system',
      timestamp: serverTimestamp(),
    });
  },
};
```

### 6.4 Friend Request Service

```typescript
// src/services/friendRequestService.ts

export const friendRequestService = {
  // Subscribe to friend requests
  subscribeToFriendRequests: (
    uid: string,
    callback: (requests: FriendRequest[]) => void
  ): Unsubscribe => {
    const q = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FriendRequest));
      callback(requests);
    });
  },
  
  // Send friend request
  sendFriendRequest: async (
    fromUser: User,
    toUser: User
  ): Promise<void> => {
    // Check if request already exists
    const existingRequest = await getDocs(
      query(
        collection(db, 'friendRequests'),
        where('fromUid', '==', fromUser.uid),
        where('toUid', '==', toUser.uid),
        where('status', '==', 'pending')
      )
    );
    
    if (!existingRequest.empty) {
      throw new Error('Friend request already sent');
    }
    
    // Create chat
    const chatId = await chatService.createChat(fromUser, toUser);
    
    // Create friend request
    await addDoc(collection(db, 'friendRequests'), {
      fromUid: fromUser.uid,
      toUid: toUser.uid,
      fromUsername: fromUser.username,
      fromDisplayName: fromUser.displayName,
      status: 'pending',
      chatId,
      createdAt: serverTimestamp(),
    });
    
    // Send system message
    await messageService.sendSystemMessage(chatId, 'Friend request sent');
  },
  
  // Find user by username
  findUserByUsername: async (username: string): Promise<User | null> => {
    const q = query(
      collection(db, 'users'),
      where('username', '==', username),
      limit(1)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  },
};
```

## 7. UI/UX Design

### 7.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  TopBar (h-16, bg-gradient purple-pink)                     │
│  ┌──────────────┐              ┌────────────────────────┐  │
│  │ Continuum    │              │ User Avatar | Logout   │  │
│  │ Messenger    │              │                        │  │
│  └──────────────┘              └────────────────────────┘  │
├──────────────────┬──────────────────────────────────────────┤
│  Sidebar         │  ChatWindow                              │
│  (w-80)          │  (flex-1)                                │
│  ┌────────────┐  │  ┌────────────────────────────────────┐ │
│  │ 🔔 (3)     │  │  │ ChatHeader                         │ │
│  │ + Add      │  │  │ Friend Name | Online Status       │ │
│  │   Friend   │  │  └────────────────────────────────────┘ │
│  └────────────┘  │  ┌────────────────────────────────────┐ │
│  ┌────────────┐  │  │                                    │ │
│  │ Chat 1     │  │  │ MessageList (overflow-y-auto)      │ │
│  │ Last msg   │  │  │                                    │ │
│  │ 2m ago  [2]│  │  │ - System messages (centered)       │ │
│  └────────────┘  │  │ - Friend messages (left, gray)     │ │
│  ┌────────────┐  │  │ - Own messages (right, blue)       │ │
│  │ Chat 2     │  │  │                                    │ │
│  │ Last msg   │  │  │                                    │ │
│  │ 1h ago     │  │  │                                    │ │
│  └────────────┘  │  └────────────────────────────────────┘ │
│                  │  ┌────────────────────────────────────┐ │
│                  │  │ MessageInput                       │ │
│                  │  │ [Reply banner if replying]         │ │
│                  │  │ ┌──────────────────────┐  ┌─────┐ │ │
│                  │  │ │ Type a message...    │  │ 📤  │ │ │
│                  │  │ └──────────────────────┘  └─────┘ │ │
│                  │  └────────────────────────────────────┘ │
└──────────────────┴──────────────────────────────────────────┘
```

### 7.2 Color Palette

```css
/* Primary Gradient */
--gradient-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
/* Alternative: purple-500 to pink-500 */

/* Chat Bubbles */
--own-message: #3b82f6;      /* blue-500 */
--friend-message: #e5e7eb;   /* gray-200 */
--system-message: #9ca3af;   /* gray-400 */

/* Accents */
--success: #10b981;          /* green-500 */
--danger: #ef4444;           /* red-500 */
--warning: #f59e0b;          /* amber-500 */

/* Text */
--text-primary: #111827;     /* gray-900 */
--text-secondary: #6b7280;   /* gray-500 */
--text-on-primary: #ffffff;  /* white */

/* Backgrounds */
--bg-primary: #ffffff;       /* white */
--bg-secondary: #f9fafb;     /* gray-50 */
--bg-hover: #f3f4f6;         /* gray-100 */
```


### 7.3 Component Specifications

#### LoginPage
- Centered card on gradient background
- Google Sign-In button (white, with Google logo)
- App logo/title above button
- Loading state during auth

#### UsernameSetup
- Modal overlay (cannot dismiss)
- Input for username (3-20 chars, alphanumeric + underscore)
- Input for display name (First Last)
- "Check Availability" button next to username input
- Real-time validation feedback (green checkmark or red X)
- "Continue" button (disabled until valid)

#### Sidebar
- Fixed width (320px)
- White background
- Top section:
  - Notification bell icon (top-right, with badge count)
  - "Add New Friend" button (full width, purple gradient)
- Chat list:
  - Scrollable
  - Each item: avatar (initials), name, last message preview, timestamp, unread badge
  - Active chat highlighted (light purple background)
  - Hover effect (light gray background)

#### ChatWindow
- Header:
  - Friend's avatar and name
  - Online status indicator (P1)
- Message list:
  - Scrollable (flex-1)
  - Auto-scroll to bottom on new message
  - Load more indicator at top
  - Message grouping by date (date separators)
- Message bubbles:
  - Own: right-aligned, blue, rounded corners (except bottom-right)
  - Friend: left-aligned, gray, rounded corners (except bottom-left)
  - System: centered, no bubble, gray text, italic
  - Hover: show timestamp and action buttons
- Message input:
  - Fixed at bottom
  - Reply banner (if replying): shows quoted message, X to cancel
  - Text input (auto-resize up to 5 lines)
  - Send button (paper plane icon, blue)

#### AddFriendModal
- Centered modal with overlay
- Title: "Add New Friend"
- Username input with search icon
- "Send Request" button (disabled until username found)
- Loading state during search
- Error message if user not found
- Success message on request sent

#### FriendRequestsModal
- Centered modal with overlay
- Title: "Friend Requests (3)"
- List of pending requests:
  - Avatar, username, display name
  - Timestamp ("2 hours ago")
  - Accept button (green, checkmark icon)
  - Decline button (red, X icon)
- Empty state: "No pending requests"

### 7.4 Responsive Design

**Desktop (> 1024px):**
- Sidebar: 320px fixed width
- Chat window: remaining space
- Max width: 1400px (centered)

**Tablet (768px - 1024px):**
- Sidebar: 280px
- Chat window: remaining space
- Slightly smaller fonts

**Mobile (< 768px):**
- Single column layout
- Show sidebar OR chat window (not both)
- Back button in chat header to return to sidebar
- Sidebar full width when visible
- Bottom navigation for key actions

## 8. Performance Optimization

### 8.1 Firestore Query Optimization

**Minimize Reads:**
- Denormalize frequently accessed data (last message in chat document)
- Use pagination (limit queries to 20 messages)
- Cache user profiles locally (React Context)
- Unsubscribe from listeners when components unmount

**Batch Operations:**
- Use `writeBatch()` for multi-document updates (accept/decline requests)
- Combine related writes (message + chat update)

**Indexes:**
- Create composite indexes for common queries
- Monitor index usage in Firebase Console

### 8.2 Frontend Optimization

**Code Splitting:**
- Lazy load modals (AddFriend, FriendRequests)
- Lazy load chat window until chat selected

**Memoization:**
- Use `React.memo()` for ChatListItem, MessageBubble
- Use `useMemo()` for expensive computations (message grouping)
- Use `useCallback()` for event handlers passed to children

**Virtual Scrolling:**
- Consider `react-window` for very long message lists (P1)
- Currently not needed for 20-message batches

**Image Optimization (P1):**
- Compress avatars before upload
- Use Firebase Storage CDN
- Lazy load images with placeholder

### 8.3 Real-Time Listener Management

```typescript
// Efficient listener setup
useEffect(() => {
  if (!chatId) return;
  
  const unsubscribe = subscribeToMessages(chatId, (messages) => {
    onInitialMessagesLoaded(messages);
  });
  
  return () => {
    unsubscribe(); // Clean up on unmount or chat change
  };
}, [chatId]);
```

## 9. Error Handling

### 9.1 Error Categories

**Network Errors:**
- Offline detection
- Retry logic with exponential backoff
- Queue messages for later send

**Authentication Errors:**
- Session expiration → redirect to login
- Permission denied → show error message

**Validation Errors:**
- Username taken → inline error message
- Invalid input → disable submit button

**Firestore Errors:**
- Write failures → show toast, retry option
- Read failures → show error state, reload button

### 9.2 Error UI Components

```typescript
// Toast notification
<Toast type="error" message="Failed to send message" action="Retry" />

// Error boundary
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>

// Inline error
<Input error="Username already taken" />
```

## 10. Testing Strategy

### 10.1 Unit Tests

**Components:**
- MessageBubble rendering (own vs friend, system)
- ChatListItem formatting (timestamp, unread count)
- UsernameInput validation

**Services:**
- Message formatting/conversion
- Timestamp utilities
- Username validation regex

**Hooks:**
- useAuth state management
- useChatList filtering/sorting

### 10.2 Integration Tests

**Flows:**
- Login → Username setup → Main app
- Send friend request → Accept → Send message
- Edit message → View history
- Delete message → Verify soft delete

**Firebase Emulator:**
- Test Firestore rules
- Test real-time listeners
- Test batch operations

### 10.3 E2E Tests (Optional)

**Critical Paths:**
- Complete onboarding flow
- Send and receive messages
- Friend request flow

**Tools:**
- Playwright or Cypress
- Firebase Emulator Suite

## 11. Deployment

### 11.1 Firebase Project Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init

# Select:
# - Firestore (rules, indexes)
# - Hosting
# - Storage (P1)

# Deploy
firebase deploy
```

### 11.2 Environment Configuration

```typescript
// src/config/firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

### 11.3 Build Configuration

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && firebase deploy"
  }
}
```

### 11.4 Hosting Configuration

```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

## 12. Monitoring & Analytics

### 12.1 Firebase Analytics

```typescript
// Track key events
logEvent(analytics, 'message_sent', { chatId });
logEvent(analytics, 'friend_request_sent', { toUsername });
logEvent(analytics, 'friend_request_accepted', { fromUsername });
```

### 12.2 Error Logging

```typescript
// Log errors to Firebase Crashlytics (P1)
try {
  await sendMessage(chatId, content);
} catch (error) {
  console.error('Failed to send message:', error);
  logEvent(analytics, 'error', {
    type: 'message_send_failed',
    error: error.message,
  });
}
```

### 12.3 Performance Monitoring

- Firebase Performance Monitoring
- Track page load times
- Track Firestore query performance
- Monitor real-time listener latency

## 13. Future Enhancements (P1+)

### 13.1 Online Presence (P1)

**Implementation:**
- Use Firebase Realtime Database for presence
- Update `isOnline` status on connect/disconnect
- Show green dot in chat list and header

```typescript
// Presence system
const presenceRef = ref(rtdb, `presence/${uid}`);
onValue(ref(rtdb, '.info/connected'), (snapshot) => {
  if (snapshot.val()) {
    onDisconnect(presenceRef).set(false);
    set(presenceRef, true);
  }
});
```

### 13.2 Emoji Reactions (P1)

**Implementation:**
- Add ReactionsPlugin to Continuum library
- Store reactions in message.reactions map
- Display emoji bar below message
- Click to add/remove reaction

### 13.3 Typing Indicators (P1)

**Implementation:**
- Store typing state in Firestore (ephemeral)
- Debounce typing events (500ms)
- Show "Friend is typing..." in chat header

### 13.4 Profile Pictures (P1)

**Implementation:**
- Upload to Firebase Storage
- Store URL in user document
- Display in avatars throughout app
- Fallback to initials

### 13.5 Group Chats (P2)

**Data Model Changes:**
- `participants` array can have 3+ members
- Add `groupName` field
- Add `groupAvatar` field
- Update UI to show multiple avatars

## 14. Development Phases

### Phase 1: Foundation (Week 1)
- Firebase project setup
- Authentication (Google Sign-In)
- Username setup flow
- Basic UI layout (TopBar, Sidebar, ChatWindow)

### Phase 2: Core Messaging (Week 2)
- Chat list display
- Real-time messaging
- Message display (own, friend, system)
- Send message functionality

### Phase 3: Friend Management (Week 3)
- Add friend flow
- Friend request notifications
- Accept/decline requests
- System messages

### Phase 4: Message Features (Week 4)
- Edit message
- Delete message
- Reply to message
- Message history (infinite scroll)

### Phase 5: Polish & Deploy (Week 5)
- Error handling
- Loading states
- Responsive design
- Testing
- Deployment

### Phase 6: P1 Features (Future)
- Online presence
- Emoji reactions
- Profile pictures
- Typing indicators

## 15. Conclusion

This design document provides a comprehensive blueprint for building Continuum Messenger. The architecture leverages Firebase for backend services, React for the frontend, and the Continuum Client Processor Library for chat state management. The modular design allows for easy extension with new features through the plugin system.

Key design decisions:
- **Denormalization**: Trade write complexity for read performance
- **Real-time listeners**: Provide instant updates without polling
- **Plugin architecture**: Enable feature extensibility
- **Security rules**: Enforce data access at the database level
- **Optimistic updates**: Improve perceived performance

The phased development approach ensures a working MVP (P0) can be delivered quickly, with room for future enhancements (P1+).

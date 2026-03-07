# Continuum Messenger

A real-time chat application built with React, Firebase, and the Continuum Client Processor Library.

## Features

- 🔐 Google Authentication
- 💬 Real-time 1-on-1 messaging
- ✏️ Edit and delete messages
- 💭 Reply to messages
- 👥 Friend request system
- 🔔 Real-time notifications
- 📱 Responsive design

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS
- **Backend**: Firebase (Firestore, Auth)
- **Chat Engine**: Continuum Client Processor Library
- **Icons**: Lucide React

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google provider
3. Create a Firestore database:
   - Go to Firestore Database
   - Create database in production mode
4. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" and click the web icon
   - Copy the config object

### 3. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in your Firebase credentials:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy Firestore Rules and Indexes

Install Firebase CLI:

```bash
npm install -g firebase-tools
```

Login and initialize:

```bash
firebase login
firebase init
```

Select:
- Firestore (rules and indexes)
- Hosting (optional, for deployment)

Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

## Project Structure

```
continuum-playground/
├── src/
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   ├── chat/              # Chat UI components
│   │   ├── layout/            # Layout components
│   │   └── modals/            # Modal dialogs
│   ├── config/
│   │   └── firebase.ts        # Firebase configuration
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication context
│   ├── services/              # Firebase service layer
│   │   ├── authService.ts
│   │   ├── chatService.ts
│   │   ├── messageService.ts
│   │   └── friendRequestService.ts
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── continuum-client-processor-lib/  # Chat engine
│   └── App.jsx                # Main app component
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
├── firebase.json              # Firebase configuration
└── .env                       # Environment variables
```

## Usage

### First Time Setup

1. Sign in with your Google account
2. Create a unique username
3. Enter your display name

### Adding Friends

1. Click "Add New Friend" button
2. Enter your friend's username
3. Click "Send Friend Request"

### Accepting Friend Requests

1. Click the bell icon (shows notification count)
2. View pending requests
3. Click Accept (✓) or Decline (✗)

### Messaging

- Type your message and press Enter or click Send
- Hover over messages to see Edit/Delete/Reply options
- Click "Edited" to view message history
- Reply to messages by clicking the Reply icon

## Continuum Client Processor Library

This app uses the Continuum Client Processor Library for chat state management. The library provides:

- Plugin-based architecture for features
- Event-driven message handling
- Optimistic updates
- Easy extensibility

See `src/continuum-client-processor-lib/README.md` for library documentation.

## Future Enhancements (P1)

- [ ] Online presence indicators
- [ ] Emoji reactions
- [ ] Profile picture uploads
- [ ] Typing indicators
- [ ] Message search
- [ ] Read receipts
- [ ] Group chats

## License

MIT

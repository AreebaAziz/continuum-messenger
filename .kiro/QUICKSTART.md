# Continuum Messenger - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or use existing project
3. Enter project name (e.g., "continuum-messenger")
4. Disable Google Analytics (optional for testing)
5. Click "Create project"

### Step 3: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Click on "Google" under Sign-in providers
4. Toggle "Enable"
5. Select a support email
6. Click "Save"

### Step 4: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Select "Start in production mode"
4. Choose a location (e.g., us-central)
5. Click "Enable"

### Step 5: Get Firebase Config

1. In Firebase Console, click the gear icon ⚙️ > Project settings
2. Scroll down to "Your apps"
3. Click the web icon `</>`
4. Register app with a nickname (e.g., "Continuum Web")
5. Copy the `firebaseConfig` object

### Step 6: Create .env File

Create a `.env` file in the project root:

```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 7: Deploy Firestore Rules

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Firestore (rules and indexes)
# - Use existing project
# - Select your project
# - Accept default files (firestore.rules, firestore.indexes.json)
# - Don't overwrite existing files

# Deploy rules and indexes
firebase deploy --only firestore
```

### Step 8: Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## ✅ Testing the App

### Test with 2 Users

1. **User 1**: Sign in with your Google account
   - Create username (e.g., "alice")
   - Enter display name (e.g., "Alice Smith")

2. **User 2**: Open incognito window, sign in with different Google account
   - Create username (e.g., "bob")
   - Enter display name (e.g., "Bob Jones")

3. **User 1**: Click "Add New Friend"
   - Enter "bob"
   - Click "Send Friend Request"

4. **User 2**: Click the bell icon 🔔
   - See friend request from Alice
   - Click Accept ✓

5. **Both users**: Start chatting!
   - Send messages
   - Try editing (hover over your message, click ⋯, select Edit)
   - Try deleting (hover over your message, click ⋯, select Delete)
   - Try replying (hover over any message, click Reply icon)

## 🎨 Features to Test

- ✅ Google Sign-In
- ✅ Username creation with availability check
- ✅ Send friend requests
- ✅ Accept/decline friend requests
- ✅ Real-time messaging
- ✅ Edit messages (with history)
- ✅ Delete messages
- ✅ Reply to messages
- ✅ Unread message counts
- ✅ Chat list sorting by recent activity

## 🐛 Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"

**Solution**: Add your domain to authorized domains
1. Go to Firebase Console > Authentication > Settings
2. Scroll to "Authorized domains"
3. Add `localhost` (should be there by default)
4. For deployment, add your hosting domain

### "Missing or insufficient permissions"

**Solution**: Deploy Firestore rules
```bash
firebase deploy --only firestore:rules
```

### "Index not found" error

**Solution**: Deploy Firestore indexes
```bash
firebase deploy --only firestore:indexes
```

Or click the link in the error message to create the index automatically.

### Messages not appearing in real-time

**Solution**: Check browser console for errors
- Ensure Firestore rules are deployed
- Verify .env variables are correct
- Restart dev server after changing .env

### Username already taken (but it's not)

**Solution**: Check Firestore
1. Go to Firebase Console > Firestore Database
2. Check `users` collection
3. Delete test users if needed

## 📦 Deployment to Firebase Hosting

### One-Time Setup

```bash
firebase init hosting

# Select:
# - Use existing project
# - Public directory: dist
# - Single-page app: Yes
# - Set up automatic builds: No
# - Don't overwrite index.html
```

### Deploy

```bash
npm run deploy
```

Or manually:

```bash
npm run build
firebase deploy --only hosting
```

Your app will be live at: `https://your-project-id.web.app`

### Update Authorized Domains

After deployment, add your hosting URL to Firebase Auth:
1. Firebase Console > Authentication > Settings
2. Authorized domains > Add domain
3. Add `your-project-id.web.app`

## 🎯 Next Steps

### P1 Features to Add

1. **Online Presence**
   - Use Firebase Realtime Database
   - Show green dot for online users

2. **Emoji Reactions**
   - Create ReactionsPlugin
   - Add emoji picker UI

3. **Profile Pictures**
   - Use Firebase Storage
   - Add image upload component

4. **Typing Indicators**
   - Store typing state in Firestore
   - Show "Friend is typing..." indicator

### Customization Ideas

- Change color scheme (update Tailwind classes)
- Add sound notifications
- Add dark mode
- Customize system messages
- Add message timestamps on hover
- Add "last seen" timestamps

## 📚 Documentation

- [Requirements Document](.kiro/requirements.md)
- [Design Document](.kiro/design.md)
- [Continuum Library Docs](../src/continuum-client-processor-lib/README.md)
- [Firebase Documentation](https://firebase.google.com/docs)

## 💡 Tips

- Use Chrome DevTools > Application > IndexedDB to inspect Firestore cache
- Use Firebase Console > Firestore > Usage to monitor read/write counts
- Test with multiple browser windows/incognito for multi-user scenarios
- Check browser console for helpful error messages
- Use Firebase Emulator Suite for local development (optional)

## 🆘 Need Help?

- Check the browser console for errors
- Review Firestore rules in Firebase Console
- Verify all environment variables are set
- Ensure Firebase services are enabled
- Check that indexes are deployed

Happy chatting! 🎉

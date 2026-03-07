# Deployment Checklist

## Pre-Deployment

### ✅ Firebase Setup
- [ ] Firebase project created
- [ ] Google Authentication enabled
- [ ] Firestore database created
- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Firestore indexes deployed (`firebase deploy --only firestore:indexes`)

### ✅ Environment Configuration
- [ ] `.env` file created with all Firebase credentials
- [ ] All `VITE_FIREBASE_*` variables set correctly
- [ ] `.env` added to `.gitignore` (already done)

### ✅ Code Quality
- [ ] No TypeScript/ESLint errors
- [ ] All components render without errors
- [ ] Test authentication flow
- [ ] Test friend request flow
- [ ] Test messaging (send, edit, delete, reply)

### ✅ Testing
- [ ] Test with 2 different Google accounts
- [ ] Test friend request send/accept/decline
- [ ] Test real-time message updates
- [ ] Test edit message with history
- [ ] Test delete message
- [ ] Test reply to message
- [ ] Test unread counts
- [ ] Test chat list sorting

## Deployment Steps

### 1. Build Production Bundle

```bash
npm run build
```

Check for build errors. The `dist` folder should be created.

### 2. Test Production Build Locally

```bash
npm run preview
```

Open the preview URL and test the app.

### 3. Initialize Firebase Hosting (First Time Only)

```bash
firebase init hosting
```

Configuration:
- Public directory: `dist`
- Single-page app: `Yes`
- Set up automatic builds: `No`
- Overwrite index.html: `No`

### 4. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Or use the npm script:

```bash
npm run deploy
```

### 5. Update Firebase Auth Authorized Domains

1. Go to Firebase Console > Authentication > Settings
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Add your hosting URL: `your-project-id.web.app`
5. Click "Add"

### 6. Test Production Deployment

1. Open `https://your-project-id.web.app`
2. Sign in with Google
3. Create username
4. Test all features

## Post-Deployment

### ✅ Verification
- [ ] App loads without errors
- [ ] Google Sign-In works
- [ ] Username creation works
- [ ] Friend requests work
- [ ] Real-time messaging works
- [ ] All features functional

### ✅ Monitoring
- [ ] Check Firebase Console > Firestore > Usage
- [ ] Monitor read/write counts
- [ ] Check for any error logs
- [ ] Verify security rules are working

### ✅ User Onboarding
- [ ] Share app URL with friends/family
- [ ] Provide quick instructions:
  1. Sign in with Google
  2. Create username
  3. Add friends by username
  4. Start chatting!

## Firestore Usage Limits (Free Tier)

Monitor these in Firebase Console:

- **Reads**: 50,000/day
- **Writes**: 20,000/day
- **Deletes**: 20,000/day
- **Storage**: 1 GB
- **Network**: 10 GB/month

For 7 users with infrequent usage, you should stay well within limits.

## Optimization Tips

### Reduce Firestore Reads

1. **Denormalize data**: Already done (last message in chat document)
2. **Use pagination**: Already implemented (20 messages at a time)
3. **Cache user profiles**: Already done (in React Context)
4. **Unsubscribe listeners**: Already implemented (useEffect cleanup)

### Monitor Costs

```bash
# Check Firebase usage
firebase projects:list
firebase use your-project-id
```

In Firebase Console:
- Go to Usage and billing
- Set up budget alerts
- Monitor daily usage

## Rollback Plan

If something goes wrong:

```bash
# View deployment history
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

Or redeploy previous version:

```bash
git checkout <previous-commit>
npm run deploy
git checkout main
```

## Security Checklist

### ✅ Firestore Rules
- [ ] Users can only read/write their own data
- [ ] Chat participants can only access their chats
- [ ] Message authors can only edit/delete their messages
- [ ] Friend requests properly secured

### ✅ Environment Variables
- [ ] `.env` not committed to git
- [ ] Firebase API key is restricted (optional, for production)

### ✅ Authentication
- [ ] Only Google Sign-In enabled
- [ ] Authorized domains configured
- [ ] No anonymous auth enabled

## Maintenance

### Regular Tasks

**Weekly**:
- Check Firebase Console for errors
- Monitor usage metrics
- Review user feedback

**Monthly**:
- Review Firestore usage
- Check for Firebase SDK updates
- Review security rules

### Updates

To update dependencies:

```bash
npm update
npm audit fix
```

To update Firebase:

```bash
npm install firebase@latest
```

## Troubleshooting Production Issues

### Users can't sign in

1. Check Firebase Console > Authentication > Settings > Authorized domains
2. Verify domain is added
3. Check browser console for errors

### Messages not sending

1. Check Firestore rules are deployed
2. Verify indexes are created
3. Check browser console for permission errors

### Real-time updates not working

1. Check Firestore listeners are active
2. Verify network connection
3. Check browser console for errors

### High Firestore usage

1. Check for infinite loops in listeners
2. Verify pagination is working
3. Review query patterns

## Support

For issues:
1. Check browser console
2. Check Firebase Console logs
3. Review Firestore rules
4. Verify environment variables
5. Test with fresh browser/incognito

## Success Metrics

Track these after deployment:

- [ ] All 7 users successfully onboarded
- [ ] Average message delivery time < 1 second
- [ ] Zero data loss incidents
- [ ] Positive user feedback
- [ ] Firestore usage within free tier limits

## Next Steps After Successful Deployment

1. Gather user feedback
2. Monitor usage patterns
3. Plan P1 features:
   - Online presence
   - Emoji reactions
   - Profile pictures
   - Typing indicators
4. Consider adding analytics
5. Plan for scaling if needed

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Production URL**: _____________

**Notes**: _____________

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FriendRequest, User } from '../types';
import { chatService } from './chatService';
import { messageService } from './messageService';

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
      const requests = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as FriendRequest)
      );
      callback(requests);
    });
  },

  // Send friend request
  sendFriendRequest: async (fromUser: User, toUser: User): Promise<void> => {
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

    // Check if chat already exists
    const existingChat = await chatService.getChatByParticipants(
      fromUser.uid,
      toUser.uid
    );

    if (existingChat && existingChat.status === 'active') {
      throw new Error('Already friends with this user');
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

    // Send system message (non-blocking, ignore errors due to eventual consistency)
    try {
      await messageService.sendSystemMessage(chatId, 'Friend request sent');
    } catch (err) {
      console.warn('System message failed (non-critical):', err);
    }
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
    return { uid: doc.id, ...doc.data() } as User;
  },
};

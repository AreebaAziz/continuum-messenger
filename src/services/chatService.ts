import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Chat, User } from '../types';

export const chatService = {
  // Subscribe to user's chats
  subscribeToChats: (
    uid: string,
    callback: (chats: Chat[]) => void
  ): Unsubscribe => {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Chat))
        .filter((chat) => chat.status !== 'declined' || chat.initiatorUid === uid);
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

    const chat = snapshot.docs.find((doc) => {
      const data = doc.data();
      return data.participants.includes(uid2);
    });

    return chat ? ({ id: chat.id, ...chat.data() } as Chat) : null;
  },

  // Create new chat (friend request)
  createChat: async (fromUser: User, toUser: User): Promise<string> => {
    const chatRef = doc(collection(db, 'chats'));
    const chatId = chatRef.id;

    await setDoc(chatRef, {
      participants: [fromUser.uid, toUser.uid],
      participantDetails: {
        [fromUser.uid]: {
          username: fromUser.username,
          displayName: fromUser.displayName,
          photoURL: fromUser.photoURL || null,
        },
        [toUser.uid]: {
          username: toUser.username,
          displayName: toUser.displayName,
          photoURL: toUser.photoURL || null,
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

    batch.update(doc(db, 'chats', chatId), {
      status: 'active',
    });

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

  // Get chat by ID
  getChat: async (chatId: string): Promise<Chat | null> => {
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (!chatDoc.exists()) return null;
    return { id: chatDoc.id, ...chatDoc.data() } as Chat;
  },
};

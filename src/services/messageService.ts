import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  getDocs,
  Unsubscribe,
  Timestamp,
  increment,
  addDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Message, Chat } from '../types';

export const messageService = {
  // Subscribe to messages
  subscribeToMessages: (
    chatId: string,
    limitCount: number,
    callback: (messages: Message[]) => void
  ): Unsubscribe => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Message))
        .reverse();
      callback(messages);
    });
  },

  // Load older messages (pagination)
  loadOlderMessages: async (
    chatId: string,
    beforeTimestamp: Timestamp,
    limitCount: number
  ): Promise<Message[]> => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      where('timestamp', '<', beforeTimestamp),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Message))
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
      props?: any;
    }
  ): Promise<string> => {
    try {
      console.log('Sending message to chatId:', chatId, message);
      
      // Get chat data first
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        throw new Error('Chat not found');
      }
      
      const chatData = chatSnap.data() as Chat;
      console.log('Chat data:', chatData);

      const otherParticipantUid = chatData.participants.find(
        (uid) => uid !== message.authorUid
      );

      // Create message document
      const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
      const messageData = {
        chatId,
        authorUid: message.authorUid,
        authorUsername: message.authorUsername,
        authorDisplayName: message.authorDisplayName,
        content: message.content,
        type: message.type || 'message',
        timestamp: serverTimestamp(),
        props: message.props || {},
      };

      console.log('Creating message with ID:', messageRef.id, messageData);

      // Use batch for atomic operation
      const batch = writeBatch(db);

      // Add message
      batch.set(messageRef, messageData);

      // Update chat's last message
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
      console.log('Message sent successfully:', messageRef.id);
      
      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Edit message
  editMessage: async (
    chatId: string,
    messageId: string,
    newContent: string,
    oldContent: string
  ): Promise<void> => {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);

    await updateDoc(messageRef, {
      content: newContent,
      'props.editedAt': serverTimestamp(),
      'props.editHistory': arrayUnion(oldContent),
    });

    // Update chat's last message if this was the last message
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    const chatData = chatSnap.data() as Chat;

    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();

    if (
      chatData.lastMessage.authorUid === messageData?.authorUid &&
      chatData.lastMessage.content === oldContent
    ) {
      await updateDoc(chatRef, {
        'lastMessage.content': newContent,
      });
    }
  },

  // Delete message
  deleteMessage: async (chatId: string, messageId: string): Promise<void> => {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);

    await updateDoc(messageRef, {
      type: 'deletedMessage',
      content: '',
      props: {},
    });

    // Update chat's last message if needed
    const chatRef = doc(db, 'chats', chatId);
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
          content:
            lastMessage.type === 'deletedMessage'
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
  sendSystemMessage: async (chatId: string, content: string): Promise<void> => {
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      chatId,
      authorUid: 'system',
      authorUsername: 'System',
      authorDisplayName: 'System',
      content,
      type: 'system',
      timestamp: serverTimestamp(),
    });
  },
};

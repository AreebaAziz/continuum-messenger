import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastSeen?: Timestamp;
  isOnline?: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  participantDetails: {
    [uid: string]: {
      username: string;
      displayName: string;
      photoURL?: string;
    };
  };
  status: 'pending' | 'active' | 'declined';
  initiatorUid: string;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  lastMessage: {
    content: string;
    authorUid: string;
    timestamp: Timestamp;
    type: string;
  };
  unreadCount: {
    [uid: string]: number;
  };
}

export interface Message {
  id: string;
  chatId: string;
  authorUid: string;
  authorUsername: string;
  authorDisplayName: string;
  content: string;
  type: string;
  timestamp: Timestamp;
  props?: {
    editedAt?: Timestamp;
    editHistory?: string[];
    replyToMessageId?: string;
    replyToContent?: string;
    replyToAuthorUid?: string;
    replyToAuthorDisplayName?: string;
    reactions?: {
      [emoji: string]: string[];
    };
  };
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  fromUsername: string;
  fromDisplayName: string;
  status: 'pending' | 'accepted' | 'declined';
  chatId: string;
  createdAt: Timestamp;
  respondedAt?: Timestamp;
}

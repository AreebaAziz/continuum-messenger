import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chatService';
import { messageService } from '../../services/messageService';
import { useContinuumChat } from '../../continuum-client-processor-lib/src/useContinuumChat';
import { EditMessagePlugin } from '../../continuum-client-processor-lib/src/core-plugins/EditMessagePlugin';
import { DeleteMessagePlugin } from '../../continuum-client-processor-lib/src/core-plugins/DeleteMessagePlugin';
import { Message as ContinuumMessage, Event } from '../../continuum-client-processor-lib/src/model';
import { CoreAction, CoreMessageType } from '../../continuum-client-processor-lib/src/common';
import { Chat, Message as FirestoreMessage } from '../../types';
import { Timestamp } from 'firebase/firestore';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  chatId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId }) => {
  const { currentUser } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyToMessage, setReplyToMessage] = useState<ContinuumMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    onInitialMessagesLoaded,
    onMessagesDiff,
    onNewEvent,
    messages,
  } = useContinuumChat({
    plugins: [EditMessagePlugin, DeleteMessagePlugin],
  });

  // Load chat details
  useEffect(() => {
    const loadChat = async () => {
      const chatData = await chatService.getChat(chatId);
      setChat(chatData);
    };
    loadChat();
  }, [chatId]);

  // Subscribe to messages
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = messageService.subscribeToMessages(
      chatId,
      20,
      (firestoreMessages) => {
        const continuumMessages = firestoreMessages.map(convertToMessage);
        onInitialMessagesLoaded(continuumMessages);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [chatId]);

  // Mark chat as read when viewing
  useEffect(() => {
    if (currentUser && chat) {
      chatService.markChatAsRead(chatId, currentUser.uid);
    }
  }, [chatId, currentUser, chat]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const convertToMessage = (msg: FirestoreMessage): ContinuumMessage => {
    return {
      id: msg.id,
      timestamp: msg.timestamp.toDate(),
      content: msg.content,
      author: {
        uid: msg.authorUid,
        displayName: msg.authorDisplayName,
      },
      type: msg.type,
      props: msg.props || {},
    };
  };

  const handleSendMessage = async (content: string) => {
    if (!currentUser || !content.trim()) return;

    const props: any = {};
    
    if (replyToMessage) {
      props.replyToMessageId = replyToMessage.id;
      props.replyToContent = replyToMessage.content;
      props.replyToAuthorUid = replyToMessage.author?.uid;
      props.replyToAuthorDisplayName = replyToMessage.author?.displayName;
    }

    const event: Event = {
      author: {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
      },
      action: replyToMessage ? CoreAction.replyToMessage : CoreAction.sendMessage,
      content: content.trim(),
      props: Object.keys(props).length > 0 ? props : undefined,
    };

    onNewEvent(event);

    // Persist to Firestore
    try {
      await messageService.sendMessage(chatId, {
        authorUid: currentUser.uid,
        authorUsername: currentUser.username,
        authorDisplayName: currentUser.displayName,
        content: content.trim(),
        type: 'message',
        props: Object.keys(props).length > 0 ? props : undefined,
      });
      setReplyToMessage(null);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string, oldContent: string) => {
    onNewEvent({
      author: {
        uid: currentUser!.uid,
        displayName: currentUser!.displayName,
      },
      action: CoreAction.editMessage,
      props: {
        messageId,
        newContent,
      },
    });

    try {
      await messageService.editMessage(chatId, messageId, newContent, oldContent);
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    onNewEvent({
      author: {
        uid: currentUser!.uid,
        displayName: currentUser!.displayName,
      },
      action: CoreAction.deleteMessage,
      props: {
        messageId,
      },
    });

    try {
      await messageService.deleteMessage(chatId, messageId);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  if (!currentUser || !chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const otherParticipantUid = chat.participants.find(
    (uid) => uid !== currentUser.uid
  );
  const otherParticipant = otherParticipantUid
    ? chat.participantDetails[otherParticipantUid]
    : null;

  return (
    <div className="flex-1 flex flex-col bg-white">
      <ChatHeader
        participant={otherParticipant}
        chatStatus={chat.status}
      />

      <MessageList
        messages={messages}
        currentUserId={currentUser.uid}
        loading={loading}
        onReply={setReplyToMessage}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
      />

      <div ref={messagesEndRef} />

      <MessageInput
        onSend={handleSendMessage}
        replyToMessage={replyToMessage}
        onCancelReply={() => setReplyToMessage(null)}
        disabled={chat.status !== 'active'}
      />
    </div>
  );
};

export default ChatWindow;

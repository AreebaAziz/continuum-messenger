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
  onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, onBack }) => {
  const { currentUser } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyToMessage, setReplyToMessage] = useState<ContinuumMessage | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    onInitialMessagesLoaded,
    onMessagesDiff,
    onNewEvent,
    messages,
  } = useContinuumChat({
    plugins: [EditMessagePlugin, DeleteMessagePlugin],
  });

  // Subscribe to chat details (real-time updates for status changes)
  useEffect(() => {
    const unsubscribe = chatService.subscribeToChat(chatId, (chatData) => {
      setChat(chatData);
    });
    return unsubscribe;
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

    setSendError(null);

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

    // Optimistic update
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
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setSendError(err.message || 'Failed to send message. Please try again.');
      // Remove optimistic message on error
      // TODO: Implement message removal in Continuum library
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
        onBack={onBack}
      />

      {sendError && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{sendError}</span>
          <button
            onClick={() => setSendError(null)}
            className="ml-2 text-red-700 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

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

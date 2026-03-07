import React from 'react';
import { Message } from '../../continuum-client-processor-lib/src/model';
import MessageBubble from './MessageBubble';
import SystemMessage from './SystemMessage';
import { CoreMessageType } from '../../continuum-client-processor-lib/src/common';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading: boolean;
  onReply: (message: Message) => void;
  onEdit: (messageId: string, newContent: string, oldContent: string) => void;
  onDelete: (messageId: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  loading,
  onReply,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="mb-2">No messages yet</p>
          <p className="text-sm">Send a message to start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
      {messages.map((msg) => {
        if (msg.type === 'system') {
          return <SystemMessage key={msg.id} message={msg} />;
        }

        if (msg.type === CoreMessageType.deletedMessage) {
          const isMe = msg.author?.uid === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className="p-3 rounded-2xl max-w-[75%] bg-gray-300 text-gray-500 italic">
                <p className="text-sm">Message deleted</p>
              </div>
            </div>
          );
        }

        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.author?.uid === currentUserId}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
};

export default MessageList;

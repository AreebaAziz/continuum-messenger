import React from 'react';
import { Chat } from '../../types';
import { Timestamp } from 'firebase/firestore';

interface ChatListItemProps {
  chat: Chat;
  currentUserId: string;
  isSelected: boolean;
  onClick: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  currentUserId,
  isSelected,
  onClick,
}) => {
  const otherParticipantUid = chat.participants.find(
    (uid) => uid !== currentUserId
  );
  const otherParticipant = otherParticipantUid
    ? chat.participantDetails[otherParticipantUid]
    : null;

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp: Timestamp): string => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateMessage = (text: string, maxLength: number = 40): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const unreadCount = chat.unreadCount?.[currentUserId] || 0;

  if (!otherParticipant) return null;

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-purple-50 border-l-4 border-l-purple-500'
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {getInitials(otherParticipant.displayName)}
        </div>

        {/* Chat Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-800 truncate">
              {otherParticipant.displayName}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatTimestamp(chat.lastMessageAt)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p
              className={`text-sm truncate ${
                unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-600'
              }`}
            >
              {chat.lastMessage.type === 'system' && (
                <span className="italic">{truncateMessage(chat.lastMessage.content)}</span>
              )}
              {chat.lastMessage.type === 'message' && (
                <>
                  {chat.lastMessage.authorUid === currentUserId && 'You: '}
                  {truncateMessage(chat.lastMessage.content)}
                </>
              )}
              {chat.lastMessage.type === 'deletedMessage' && (
                <span className="italic text-gray-400">Message deleted</span>
              )}
            </p>
            {unreadCount > 0 && (
              <span className="ml-2 bg-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pending status */}
      {chat.status === 'pending' && (
        <div className="mt-2 text-xs text-amber-600 font-medium">
          {chat.initiatorUid === currentUserId ? 'Pending' : 'Friend Request'}
        </div>
      )}
    </div>
  );
};

export default ChatListItem;

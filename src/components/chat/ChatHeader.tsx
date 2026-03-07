import React from 'react';

interface ChatHeaderProps {
  participant: {
    username: string;
    displayName: string;
    photoURL?: string;
  } | null;
  chatStatus: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ participant, chatStatus }) => {
  if (!participant) return null;

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-16 border-b border-gray-200 flex items-center px-6 bg-white">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
          {getInitials(participant.displayName)}
        </div>
        <div>
          <h2 className="font-semibold text-gray-800">
            {participant.displayName}
          </h2>
          <p className="text-xs text-gray-500">@{participant.username}</p>
        </div>
        {chatStatus === 'pending' && (
          <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
            Pending
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;

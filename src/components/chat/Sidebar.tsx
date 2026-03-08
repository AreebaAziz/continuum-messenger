import React, { useEffect, useState } from 'react';
import { Bell, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chatService';
import { friendRequestService } from '../../services/friendRequestService';
import { Chat, FriendRequest } from '../../types';
import ChatListItem from './ChatListItem';

interface SidebarProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenAddFriend: () => void;
  onOpenFriendRequests: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedChatId,
  onSelectChat,
  onOpenAddFriend,
  onOpenFriendRequests,
}) => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeChats = chatService.subscribeToChats(
      currentUser.uid,
      (chats) => {
        setChats(chats);
        setLoading(false);
      }
    );

    const unsubscribeRequests = friendRequestService.subscribeToFriendRequests(
      currentUser.uid,
      (requests) => {
        setFriendRequests(requests);
      }
    );

    return () => {
      unsubscribeChats();
      unsubscribeRequests();
    };
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div className="w-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
          <button
            onClick={onOpenFriendRequests}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Friend Requests"
          >
            <Bell size={20} className="text-gray-600" />
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {friendRequests.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onOpenAddFriend}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <UserPlus size={18} />
          Add New Friend
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading chats...</div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="mb-2">No chats yet</p>
            <p className="text-sm">Add a friend to start chatting!</p>
          </div>
        ) : (
          chats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              currentUserId={currentUser.uid}
              isSelected={chat.id === selectedChatId}
              onClick={() => onSelectChat(chat.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;

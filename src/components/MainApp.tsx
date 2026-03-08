import React, { useState } from 'react';
import TopBar from './layout/TopBar';
import Sidebar from './chat/Sidebar';
import ChatWindow from './chat/ChatWindow';
import AddFriendModal from './modals/AddFriendModal';
import FriendRequestsModal from './modals/FriendRequestsModal';

const MainApp: React.FC = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-500 to-pink-500">
      <TopBar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile: Show sidebar OR chat window */}
        {/* Desktop: Show both */}
        <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0`}>
          <Sidebar
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            onOpenAddFriend={() => setShowAddFriend(true)}
            onOpenFriendRequests={() => setShowFriendRequests(true)}
          />
        </div>

        {selectedChatId ? (
          <div className="flex-1 flex">
            <ChatWindow 
              key={selectedChatId}
              chatId={selectedChatId} 
              onBack={handleBackToList}
            />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-white">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg mb-2">Select a chat to start messaging</p>
              <p className="text-sm">or add a new friend to begin</p>
            </div>
          </div>
        )}
      </div>

      <AddFriendModal
        isOpen={showAddFriend}
        onClose={() => setShowAddFriend(false)}
      />

      <FriendRequestsModal
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
      />
    </div>
  );
};

export default MainApp;

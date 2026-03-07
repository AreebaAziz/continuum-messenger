import React, { useState, useEffect } from 'react';
import { X, Check, XIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { friendRequestService } from '../../services/friendRequestService';
import { chatService } from '../../services/chatService';
import { messageService } from '../../services/messageService';
import { FriendRequest } from '../../types';
import { Timestamp } from 'firebase/firestore';

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !isOpen) return;

    const unsubscribe = friendRequestService.subscribeToFriendRequests(
      currentUser.uid,
      setRequests
    );

    return unsubscribe;
  }, [currentUser, isOpen]);

  const handleAccept = async (request: FriendRequest) => {
    setProcessing(request.id);
    try {
      await chatService.acceptFriendRequest(request.chatId, request.id);
      await messageService.sendSystemMessage(
        request.chatId,
        `Start of chat with ${request.fromUsername}`
      );
    } catch (err) {
      console.error('Failed to accept request:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (request: FriendRequest) => {
    setProcessing(request.id);
    try {
      await chatService.declineFriendRequest(request.chatId, request.id);
    } catch (err) {
      console.error('Failed to decline request:', err);
    } finally {
      setProcessing(null);
    }
  };

  const formatTimestamp = (timestamp: Timestamp): string => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            Friend Requests {requests.length > 0 && `(${requests.length})`}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No pending friend requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {getInitials(request.fromDisplayName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800">
                        {request.fromDisplayName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        @{request.fromUsername}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(request.createdAt)}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {request.fromDisplayName} would like to start a chat with you
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request)}
                      disabled={processing === request.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === request.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <>
                          <Check size={18} />
                          Accept
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDecline(request)}
                      disabled={processing === request.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === request.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <>
                          <XIcon size={18} />
                          Decline
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequestsModal;

import React, { useState } from 'react';
import { X, Search, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { friendRequestService } from '../../services/friendRequestService';
import { User } from '../../types';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSearch = async () => {
    if (!username.trim()) return;

    setSearching(true);
    setError(null);
    setFoundUser(null);
    setSuccess(false);

    try {
      const user = await friendRequestService.findUserByUsername(username.trim());
      
      if (!user) {
        setError('User not found');
      } else if (user.uid === currentUser?.uid) {
        setError('You cannot add yourself as a friend');
      } else {
        setFoundUser(user);
      }
    } catch (err: any) {
      setError('Failed to search for user');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!foundUser || !currentUser) return;

    setSending(true);
    setError(null);

    try {
      await friendRequestService.sendFriendRequest(currentUser, foundUser);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send friend request');
      setSending(false);
    }
  };

  const resetModal = () => {
    setUsername('');
    setFoundUser(null);
    setError(null);
    setSuccess(false);
    setSearching(false);
    setSending(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetModal, 300);
  };

  if (!isOpen) return null;

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Add New Friend</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter username
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="username"
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !username.trim()}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {searching ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
              Friend request sent successfully!
            </div>
          )}

          {/* Found User */}
          {foundUser && !success && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                  {getInitials(foundUser.displayName)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {foundUser.displayName}
                  </h3>
                  <p className="text-sm text-gray-600">@{foundUser.username}</p>
                </div>
              </div>
              <button
                onClick={handleSendRequest}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Send Friend Request
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;

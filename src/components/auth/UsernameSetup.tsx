import React, { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

const UsernameSetup: React.FC = () => {
  const { firebaseUser, refreshUser } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(
    firebaseUser?.displayName || ''
  );
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUsername = (value: string): boolean => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(value);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setAvailable(null);
    setError(null);
  };

  const checkAvailability = async () => {
    if (!validateUsername(username)) {
      setError('Username must be 3-20 characters (letters, numbers, underscores)');
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const isAvailable = await authService.checkUsernameAvailability(username);
      setAvailable(isAvailable);
      if (!isAvailable) {
        setError('Username is already taken');
      }
    } catch (err: any) {
      setError('Failed to check availability');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!available) {
      setError('Please check username availability first');
      return;
    }

    if (!displayName.trim()) {
      setError('Please enter your display name');
      return;
    }

    if (!firebaseUser) return;

    setCreating(true);
    setError(null);

    try {
      await authService.createUserProfile({
        uid: firebaseUser.uid,
        username,
        displayName: displayName.trim(),
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || undefined,
      });
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">♾️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">Choose a unique username</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="First Last"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                />
                {available !== null && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {available ? (
                      <Check className="text-green-500" size={20} />
                    ) : (
                      <X className="text-red-500" size={20} />
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={checkAvailability}
                disabled={checking || !username}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {checking ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  'Check'
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {available && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
              Username is available!
            </div>
          )}

          <button
            type="submit"
            disabled={!available || creating || !displayName.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Creating Profile...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsernameSetup;

import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TopBar: React.FC = () => {
  const { currentUser, signOut } = useAuth();

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-16 bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-between px-6 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-3xl">♾️</span>
        <h1 className="text-xl font-bold text-white">Continuum Messenger</h1>
      </div>

      <div className="flex items-center gap-4">
        {currentUser && (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
                {getInitials(currentUser.displayName)}
              </div>
              <div className="text-white">
                <div className="font-semibold">{currentUser.displayName}</div>
                <div className="text-xs opacity-90">@{currentUser.username}</div>
              </div>
            </div>
            <button
              onClick={signOut}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TopBar;

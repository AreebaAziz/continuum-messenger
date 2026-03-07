import React, { useState } from 'react';
import { Send, X, Reply } from 'lucide-react';
import { Message } from '../../continuum-client-processor-lib/src/model';

interface MessageInputProps {
  onSend: (content: string) => void;
  replyToMessage: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  replyToMessage,
  onCancelReply,
  disabled = false,
}) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() === '' || disabled) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Reply Banner */}
      {replyToMessage && (
        <div className="px-6 pt-3 pb-2 bg-gray-50 flex items-center justify-between">
          <div className="flex items-start flex-1 min-w-0">
            <Reply size={14} className="text-gray-500 mr-2 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-600">
                Replying to {replyToMessage.author?.displayName}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {replyToMessage.content}
              </p>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 flex items-end gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Accept friend request to send messages' : 'Type a message...'}
          disabled={disabled}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 resize-none max-h-32 disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={1}
          style={{
            minHeight: '40px',
            height: 'auto',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 128) + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || input.trim() === ''}
          className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;

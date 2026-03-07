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
        <div className="px-4 pt-3 pb-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-start flex-1 min-w-0">
            <Reply size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-700">
                Replied to {replyToMessage.author?.displayName}
              </p>
              <p className="text-sm text-blue-600 truncate">
                {replyToMessage.content}
              </p>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="ml-2 p-1 hover:bg-blue-100 rounded-full transition-colors flex-shrink-0"
          >
            <X size={16} className="text-blue-600" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 flex items-end gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Friend request not yet accepted' : 'Type a message...'}
          disabled={disabled}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none max-h-32 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
          rows={1}
          style={{
            minHeight: '44px',
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
          className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-sm hover:shadow-md"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;

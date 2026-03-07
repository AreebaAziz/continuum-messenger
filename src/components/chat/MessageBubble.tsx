import React, { useState } from 'react';
import { MoreHorizontal, Reply } from 'lucide-react';
import { Message } from '../../continuum-client-processor-lib/src/model';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReply: (message: Message) => void;
  onEdit: (messageId: string, newContent: string, oldContent: string) => void;
  onDelete: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onReply,
  onEdit,
  onDelete,
}) => {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showEditHistory, setShowEditHistory] = useState(false);

  const handleMenuClick = (e: React.MouseEvent, messageId: string) => {
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setMenuMessageId(messageId);
  };

  const handleEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
    setMenuMessageId(null);
  };

  const saveEdit = (messageId: string, oldContent: string) => {
    if (editingContent.trim() === '') return;
    onEdit(messageId, editingContent.trim(), oldContent);
    setEditingMessageId(null);
    setEditingContent('');
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleDelete = (messageId: string) => {
    onDelete(messageId);
    setMenuMessageId(null);
  };

  const handleReply = (message: Message) => {
    onReply(message);
  };

  const isEditing = editingMessageId === message.id;
  const hasEditHistory =
    message.props?.editHistory && message.props.editHistory.length > 0;

  return (
    <div className="w-full">
      {/* Edit History */}
      {showEditHistory && hasEditHistory && (
        <div
          className={`flex w-full mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
        >
          <div className="max-w-[75%] space-y-2">
            {message.props!.editHistory!.map((editedContent, index) => (
              <div
                key={`${message.id}-edit-${index}`}
                className={`p-3 rounded-2xl break-words opacity-60 ${
                  isOwn
                    ? 'bg-blue-400 text-white rounded-br-none'
                    : 'bg-gray-300 text-gray-700 rounded-bl-none'
                }`}
              >
                <p>{editedContent}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={`flex w-full items-center ${isOwn ? 'justify-end' : 'justify-start'}`}
        onMouseEnter={() => !isEditing && setHoveredMessageId(message.id)}
        onMouseLeave={() => setHoveredMessageId(null)}
      >
        {/* Three dots menu - left side for own messages */}
        {isOwn && hoveredMessageId === message.id && !isEditing && (
          <button
            onClick={(e) => handleMenuClick(e, message.id)}
            className="mr-2 p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
          >
            <MoreHorizontal size={16} className="text-gray-600" />
          </button>
        )}

        <div className={`max-w-[75%] ${isOwn ? 'text-right' : 'text-left'}`}>
          {/* Edited indicator */}
          {hasEditHistory && !isEditing && (
            <button
              onClick={() => setShowEditHistory(!showEditHistory)}
              className={`text-xs mb-1 hover:underline cursor-pointer ${
                isOwn ? 'text-blue-300' : 'text-gray-500'
              }`}
            >
              Edited
            </button>
          )}

          {/* Replied-to message */}
          {message.props?.replyToMessageId && (
            <div className="mb-1">
              <p className="text-xs text-gray-500 mb-1">
                {message.props.replyToAuthorUid === message.author?.uid
                  ? 'You replied to yourself'
                  : `You replied to ${message.props.replyToAuthorDisplayName}`}
              </p>
              <div
                className={`p-2 rounded-2xl break-words opacity-70 ${
                  isOwn
                    ? 'bg-gray-400 text-white rounded-br-none'
                    : 'bg-gray-300 text-gray-700 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{message.props.replyToContent}</p>
              </div>
            </div>
          )}

          <div
            className={`p-3 rounded-2xl break-words ${
              isOwn
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-800 rounded-bl-none'
            }`}
          >
            {!isOwn && (
              <span className="font-semibold text-sm mb-1 italic block">
                {message.author?.displayName}:
              </span>
            )}

            {/* Editing mode */}
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 bg-white"
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(message.id, message.content || '');
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1 text-xs bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveEdit(message.id, message.content || '')}
                    className="px-3 py-1 text-xs bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p>{message.content}</p>
            )}
          </div>
        </div>

        {/* Reply icon - right side for other's messages */}
        {!isOwn && hoveredMessageId === message.id && (
          <button
            onClick={() => handleReply(message)}
            className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
          >
            <Reply size={16} className="text-gray-600" />
          </button>
        )}
      </div>

      {/* Popup menu */}
      {menuMessageId === message.id && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleReply(message)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer text-sm"
          >
            Reply
          </button>
          <button
            onClick={() => handleEdit(message.id, message.content || '')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(message.id)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer text-sm text-red-600"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;

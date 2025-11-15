import { useEffect, useState } from "react";
import { Send, MoreHorizontal, Reply, X } from "lucide-react";
import { useContinuumChat } from './continuum-client-processor-lib/src/index'
import { Message, Event } from "./continuum-client-processor-lib/src/model";
import { CoreAction } from "./continuum-client-processor-lib/src/common";

export default function SelfChat() {
  const [input, setInput] = useState("")
  const [hoveredMessageId, setHoveredMessageId] = useState(null)
  const [menuMessageId, setMenuMessageId] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingContent, setEditingContent] = useState("")

  const {
    onInitialMessagesLoaded,
    onMessagesDiff,
    onNewEvent,
    messages,
    localData
  } = useContinuumChat({
  })

  useEffect(() => {
    const messagesOnInitialLoad: Message[] = [
      {
        id: "test",
        timestamp: new Date(),
        author: {
          uid: "testuid",
          displayName: "Areeba",
        },
        content:
          "hello world! testy tiadjhif afdnkefj erfjer ver fjklner kjf erkfj erjkf erjf erjk ",
        props: {
          modifiedLocally: true,
        },
      },
      {
        id: "test1",
        timestamp: new Date(),
        author: {
          uid: "me",
          displayName: "me",
        },
        content:
          "hi there! asoidfjhaoif naodijfa dfoiernf reiofj aerfio;erf oierjf aer;oifj",
      },
    ];
    onInitialMessagesLoaded(messagesOnInitialLoad)
    
    setTimeout(() => {
      onMessagesDiff({
        add: [{
          id: "test33",
          timestamp: new Date(),
          author: {
            uid: "friend",
            displayName: "Friend",
          },
          content:
            "a new message from the server", 
          }],
        edit: [{
          messageId: 'test1',
          newContent: 'hi there!'
        }],
        delete: ['test']
      })
    }, 3000)
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setMenuMessageId(null)
    if (menuMessageId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [menuMessageId])

  const sendMessage = () => {
    if (input.trim() === "") return;
    // post event here
    const event: Event = {
      author: {
        uid: 'me',
        displayName: 'me'
      },
      action: CoreAction.sendMessage,
      content: input.trim()
    }
    onNewEvent(event)
    setInput("");
    setReplyToMessage(null);
  };

  const handleMenuClick = (e, messageId) => {
    e.stopPropagation()
    setMenuPosition({ x: e.clientX, y: e.clientY })
    setMenuMessageId(messageId)
  }

  const handleReply = (message) => {
    setReplyToMessage(message)
  }

  const handleEdit = (messageId) => {
    const message = messages.find(m => m.id === messageId)
    if (message) {
      setEditingMessageId(messageId)
      setEditingContent(message.content)
    }
    setMenuMessageId(null)
  }

  const saveEdit = (messageId) => {
    if (editingContent.trim() === "") return
    
    onNewEvent({
      author: {
        uid: 'me',
        displayName: 'me'
      },
      action: CoreAction.editMessage,
      props: {
        messageId,
        newContent: editingContent.trim()
      }
    })
    setEditingMessageId(null)
    setEditingContent("")
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent("")
  }

  const handleDelete = (messageId) => {
    console.log('Delete message:', messageId)
    onNewEvent({
      author: {
        uid: 'me',
        displayName: 'me'
      },
      action: CoreAction.deleteMessage,
      props: {
        messageId
      }
    })
    setMenuMessageId(null)
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg flex flex-col h-5/6">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.author?.uid === "me";
            const isEditing = editingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex w-full items-center ${isMe ? "justify-end" : "justify-start"}`}
                onMouseEnter={() => !isEditing && setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {/* Three dots menu - left side for "me" */}
                {isMe && hoveredMessageId === msg.id && !isEditing && (
                  <button
                    onClick={(e) => handleMenuClick(e, msg.id)}
                    className="mr-2 p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                  >
                    <MoreHorizontal size={16} className="text-gray-600" />
                  </button>
                )}

                <div
                  className={`p-3 rounded-2xl max-w-[75%] break-words ${
                    isMe
                      ? "bg-blue-500 text-white rounded-br-none text-right"
                      : "bg-gray-200 text-gray-800 rounded-bl-none text-left"
                  }`}
                >
                  {msg.author.uid !== "me" && (
                    <span className="font-semibold text-sm mb-1 italic block">
                      {msg.author?.displayName}:
                    </span>
                  )}
                  
                  {/* Show input box when editing */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 bg-white"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(msg.id)
                          if (e.key === "Escape") cancelEdit()
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
                          onClick={() => saveEdit(msg.id)}
                          className="px-3 py-1 text-xs bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p>{msg.content}</p>
                      {msg.props?.modifiedLocally && (
                        <p className="text-xs text-red-500 mt-1">
                          Modified locally
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Reply icon - right side for others */}
                {!isMe && hoveredMessageId === msg.id && (
                  <button
                    onClick={() => handleReply(msg)}
                    className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                  >
                    <Reply size={16} className="text-gray-600" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Reply preview banner */}
        {replyToMessage && (
          <div className="px-3 pt-2 pb-1 border-t bg-gray-50 flex items-center justify-between">
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
              onClick={() => setReplyToMessage(null)}
              className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>
        )}

        {/* Input bar */}
        <div className="p-3 border-t flex items-center">
          <input
            type="text"
            className="flex-1 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="ml-2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Popup menu */}
      {menuMessageId && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleEdit(menuMessageId)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(menuMessageId)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer text-sm"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
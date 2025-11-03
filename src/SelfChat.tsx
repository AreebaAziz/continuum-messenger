import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { useContinuumChat } from './continuum-client-processor-lib/src/index'
import { Message, Event } from "./continuum-client-processor-lib/src/model";
import { CoreAction } from "./continuum-client-processor-lib/src/common";

export default function SelfChat() {
  const [input, setInput] = useState("")
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
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg flex flex-col h-5/6">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.author?.uid === "me";
            return (
              <div
                key={msg.id}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
              >
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
                  <p>{msg.content}</p>
                  {msg.props?.modifiedLocally && (
                    <p className="text-xs text-red-500 mt-1">
                      Modified locally
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

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
    </div>
  );
}


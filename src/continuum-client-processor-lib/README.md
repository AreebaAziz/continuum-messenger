# Continuum Client Processor Library

A flexible, plugin-based chat library for building real-time messaging applications with React. The library provides a clean event-driven architecture that allows developers to extend functionality through custom plugins.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Plugin Development](#plugin-development)
- [Examples](#examples)

## Overview

Continuum is designed around two fundamental concepts:

1. **Events**: User actions (sending messages, editing, deleting, etc.) are represented as events
2. **Plugins**: Modular components that react to events and transform the chat state

This architecture makes it easy to add features like message editing, deletion, reactions, threading, and more without modifying the core library.

## Core Concepts

### Events

Events represent user actions in the chat. Every interaction (sending a message, editing, deleting) is an event that flows through the system.

```typescript
interface Event {
  author: Author,
  action: string,           // e.g., "sendMessage", "editMessage"
  content?: string,         // Message content
  id?: string,              // Auto-generated UUID
  timestamp?: Date,         // Auto-generated timestamp
  props?: Record<string, any>  // Additional metadata
}
```

### Messages

Messages are the rendered state of events. The library automatically converts events to messages.

```typescript
interface Message {
  id: string,
  timestamp: Date,
  content?: string,
  author?: Author,
  type?: string,            // e.g., "message", "deletedMessage"
  props?: Record<string, any>  // Metadata (edit history, reply info, etc.)
}
```

### Plugins

Plugins intercept events and can:
- Transform events before they become messages
- Update existing messages in the chat
- Store local state
- Queue additional events

```typescript
interface Plugin {
  onInitialMessagesLoaded?: Changes,
  onMessagesDiff?: Changes,
  onNewEvent?: (event: Event) => OnNewEventOutput
}
```

## Getting Started

### Installation

```bash
npm install uuid
# The library uses uuid for generating message IDs
```

### Basic Usage

```typescript
import { useContinuumChat } from './continuum-client-processor-lib/src/index'
import { Message, Event } from './continuum-client-processor-lib/src/model'
import { CoreAction } from './continuum-client-processor-lib/src/common'

function ChatComponent() {
  const {
    onInitialMessagesLoaded,
    onMessagesDiff,
    onNewEvent,
    messages,
    localData
  } = useContinuumChat({
    plugins: []  // Add plugins here
  })

  // Load initial messages
  useEffect(() => {
    const initialMessages: Message[] = [
      {
        id: "msg1",
        timestamp: new Date(),
        type: "message",
        author: { uid: "user1", displayName: "Alice" },
        content: "Hello!"
      }
    ]
    onInitialMessagesLoaded(initialMessages)
  }, [])

  // Send a new message
  const sendMessage = (text: string) => {
    const event: Event = {
      author: { uid: 'me', displayName: 'Me' },
      action: CoreAction.sendMessage,
      content: text
    }
    onNewEvent(event)
  }

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}
```

## API Reference

### `useContinuumChat(props)`

The main hook for integrating the chat library.

#### Parameters

```typescript
interface UseContinuumChatProps {
  fetchChatState?: (jsonPath: any) => Record<string, any>,
  plugins?: Plugin[]
}
```

#### Returns

```typescript
{
  onInitialMessagesLoaded: (messages: Message[]) => void,
  onMessagesDiff: (diff: MessagesDiff) => void,
  onNewEvent: (event: Event) => void,
  messages: Message[],
  localData: Record<string, any>
}
```

### Methods

#### `onInitialMessagesLoaded(messages)`

Call this when the client first retrieves messages from the server (e.g., on page load).

```typescript
onInitialMessagesLoaded([
  {
    id: "msg1",
    timestamp: new Date(),
    type: "message",
    author: { uid: "user1", displayName: "Alice" },
    content: "Hello!"
  }
])
```

#### `onMessagesDiff(diff)`

Call this when receiving updates from the server (new messages, edits, deletions).

```typescript
interface MessagesDiff {
  add?: Message[],           // New messages to add
  edit?: EditMessage[],      // Messages to edit
  delete?: string[]          // Message IDs to delete
}

// Example
onMessagesDiff({
  add: [newMessage],
  edit: [{ messageId: "msg1", newMessageOrContent: "Updated text" }],
  delete: ["msg2"]
})
```

#### `onNewEvent(event)`

Call this when the user performs an action (sends a message, edits, deletes, etc.).

```typescript
// Send a message
onNewEvent({
  author: { uid: 'me', displayName: 'Me' },
  action: CoreAction.sendMessage,
  content: "Hello world"
})

// Edit a message
onNewEvent({
  author: { uid: 'me', displayName: 'Me' },
  action: CoreAction.editMessage,
  props: {
    messageId: "msg1",
    newContent: "Updated message"
  }
})

// Delete a message
onNewEvent({
  author: { uid: 'me', displayName: 'Me' },
  action: CoreAction.deleteMessage,
  props: { messageId: "msg1" }
})
```

## Plugin Development

### Plugin Structure

A plugin is an object that implements the `Plugin` interface:

```typescript
interface Plugin {
  onInitialMessagesLoaded?: Changes,
  onMessagesDiff?: Changes,
  onNewEvent?: (event: Event) => OnNewEventOutput
}
```

### Creating a Plugin

Plugins can intercept events and modify the chat state. Here's how to create a custom plugin:

```typescript
import { Plugin } from "./plugin"
import { Event, EditMessage } from "./model"

export const MyCustomPlugin: Plugin = {
  onNewEvent: (event: Event) => {
    // Check if this plugin should handle this event
    if (event.action === "myCustomAction") {
      return {
        changes: {
          // Update existing messages
          updateLocalMessages: (messages) => {
            let edits: EditMessage[] = []
            // Find and modify messages
            messages.forEach(msg => {
              if (/* some condition */) {
                edits.push({
                  messageId: msg.id,
                  newMessageOrContent: {
                    ...msg,
                    props: { ...msg.props, customFlag: true }
                  }
                })
              }
            })
            return edits
          },
          
          // Update local data store
          updateLocalData: { someKey: "someValue" },
          
          // Queue additional events
          postToLocalEventQueue: [
            { action: "followUpAction", props: {} }
          ]
        },
        
        // Return the event (can be modified)
        event
      }
    }

    // If not handling, return unchanged
    return { changes: {}, event }
  }
}
```

### Built-in Plugins

#### EditMessagePlugin

Handles message editing with history tracking.

```typescript
import { EditMessagePlugin } from './continuum-client-processor-lib/src/index'

// Usage
useContinuumChat({
  plugins: [EditMessagePlugin]
})

// Trigger an edit
onNewEvent({
  author: { uid: 'me', displayName: 'Me' },
  action: CoreAction.editMessage,
  props: {
    messageId: "msg1",
    newContent: "Updated text"
  }
})

// The plugin stores edit history in message.props.messageHistory
```

#### DeleteMessagePlugin

Handles message deletion (soft delete).

```typescript
import { DeleteMessagePlugin } from './continuum-client-processor-lib/src/index'

// Usage
useContinuumChat({
  plugins: [DeleteMessagePlugin]
})

// Trigger a delete
onNewEvent({
  author: { uid: 'me', displayName: 'Me' },
  action: CoreAction.deleteMessage,
  props: { messageId: "msg1" }
})

// The plugin changes the message type to "deletedMessage"
```

### Plugin Best Practices

1. **Keep plugins focused**: Each plugin should handle one feature
2. **Use event.props for metadata**: Store additional data in the props field
3. **Return unchanged events**: If your plugin doesn't handle an event, return it unchanged
4. **Leverage automatic prop passing**: Event props automatically become message props, so simple features don't need plugins

## Examples

### Example 1: Reply to Message

No plugin needed! Event props automatically transfer to messages.

```typescript
// Send a reply
onNewEvent({
  author: { uid: 'me', displayName: 'Me' },
  action: CoreAction.replyToMessage,
  content: "This is my reply",
  props: {
    replyToMessageId: "msg1",
    replyToContent: "Original message",
    replyToAuthor: { uid: "user1", displayName: "Alice" }
  }
})

// In your UI, check for reply metadata
{messages.map(msg => (
  <div key={msg.id}>
    {msg.props?.replyToMessageId && (
      <div className="reply-indicator">
        Replying to {msg.props.replyToAuthor?.displayName}
      </div>
    )}
    <div>{msg.content}</div>
  </div>
))}
```

### Example 2: Message Reactions Plugin

```typescript
export const ReactionsPlugin: Plugin = {
  onNewEvent: (event: Event) => {
    if (event.action === "addReaction") {
      return {
        changes: {
          updateLocalMessages: (messages) => {
            return messages
              .filter(msg => msg.id === event.props?.messageId)
              .map(msg => ({
                messageId: msg.id,
                newMessageOrContent: {
                  ...msg,
                  props: {
                    ...msg.props,
                    reactions: [
                      ...(msg.props?.reactions || []),
                      {
                        emoji: event.props?.emoji,
                        author: event.author
                      }
                    ]
                  }
                }
              }))
          }
        },
        event
      }
    }
    return { changes: {}, event }
  }
}

// Usage
onNewEvent({
  author: { uid: 'me', displayName: 'Me' },
  action: "addReaction",
  props: {
    messageId: "msg1",
    emoji: "👍"
  }
})
```

### Example 3: Typing Indicator Plugin

```typescript
export const TypingIndicatorPlugin: Plugin = {
  onNewEvent: (event: Event) => {
    if (event.action === "userTyping") {
      return {
        changes: {
          updateLocalData: {
            typingUsers: [
              ...(localData.typingUsers || []),
              event.author
            ]
          }
        },
        event
      }
    }
    
    if (event.action === "userStoppedTyping") {
      return {
        changes: {
          updateLocalData: {
            typingUsers: (localData.typingUsers || [])
              .filter(u => u.uid !== event.author.uid)
          }
        },
        event
      }
    }
    
    return { changes: {}, event }
  }
}
```

## Architecture Diagram

```
User Action
    ↓
  Event
    ↓
onNewEvent()
    ↓
Plugin Chain (each plugin can transform event/state)
    ↓
convertEventToMessage()
    ↓
Add to Messages Array
    ↓
React Re-render
```

## Core Actions

The library provides these built-in actions:

```typescript
enum CoreAction {
  sendMessage = "sendMessage",
  editMessage = "editMessage",
  deleteMessage = "deleteMessage",
  replyToMessage = "replyToMessage"
}
```

You can define custom actions for your plugins:

```typescript
const MY_CUSTOM_ACTION = "myCustomAction"

onNewEvent({
  author: { uid: 'me', displayName: 'Me' },
  action: MY_CUSTOM_ACTION,
  props: { /* custom data */ }
})
```

## Message Types

```typescript
enum CoreMessageType {
  message = "message",
  edit = "edit",
  delete = "delete",
  deletedMessage = "deletedMessage",
  replyMessage = "replyMessage"
}
```

## Future Enhancements

Potential areas for expansion:

- **Server-side library**: Mirror plugin architecture for server-side processing
- **Optimistic updates**: Better handling of pending messages
- **Conflict resolution**: Handle concurrent edits
- **Message threading**: Built-in support for threaded conversations
- **Read receipts**: Track message read status
- **Search**: Full-text search across messages
- **Persistence**: Built-in local storage integration

## Contributing

When adding new features:

1. Consider if it needs a plugin or if event props are sufficient
2. Keep the core library minimal
3. Document your plugins with examples
4. Follow the existing patterns for consistency

## License

[Your License Here]

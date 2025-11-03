import { v4 as uuidv4 } from 'uuid';
import { Message, Event, MessagesDiff } from './model'
import { Plugin } from './plugin'
import { useState } from "react";
import { CoreAction } from './common';
import { convertEventToMessage } from './util';

interface UseContinuumChatProps {
  fetchChatState?: (jsonPath: any) => Record<string, any>,
  plugins?: Plugin[]
}

export function useContinuumChat(props: UseContinuumChatProps) {

  const [messages, setMessages] = useState<Message[]>([])
  const [localData, setLocalData] = useState({})

  /**
   * Call this when client first retrieves the latest set of messages from server.
   * @param messages initial messages
   */
  const onInitialMessagesLoaded = (messages: Message[]) => {
    console.log("initial messages loaded")
    setMessages(messages)
  }

  /**
   * Call this when either: 
   * 1) new messages retrieved from the server, eg. peer sends message
   * 2) user scrolls up retrieving older messages
   * @param diff TBD
   */
  const onMessagesDiff = (diff: MessagesDiff) => {
    /**
     * can do an add, edited, and delete messages. 
     * for Add: need to sort the two lists by message timestamp
     * for edited: should come as a map of message id -> new message. We will do linear search in our messages list to find the affected messages and update their content
     * for deleted: same as above, do a lienar search and delete the affected message ids 
     */
    console.log("on messages diff")
    setMessages(messages => {
      // 1. Process add messages
      const allMessages: Message[] = diff.add ? [...messages, ...diff.add] : messages
      if (diff.add) {
        allMessages.sort((a, b) => (a.timestamp.getTime() - b.timestamp.getTime()))
      }

      // 2. Process edits 
      diff.edit?.forEach(editMessage => {
        allMessages.forEach(msg => {
          if (editMessage.messageId === msg.id) {
            msg.content = editMessage.newContent
          }
        })
      })

      // 3. Process deletes 
      for (let i = 0; diff.delete && i < diff.delete.length; i++) {
        for (let j = 0; j < allMessages.length; j++) {
          if (diff.delete[i] === allMessages[j]?.id) {
            allMessages.splice(j, 1)
            break
          }
        }
      }

      return allMessages
    })
  }

  /**
   * Call this when user inputs a new raw event such as a new message or in-game action.
   * @param event New raw event from the user
   */
  const onNewEvent = (event: Event) => {
    console.log("on new event")
    if (event.action == CoreAction.editMessage) {
      // handle edit message by updating the message id's content
    } else if (event.action == CoreAction.deleteMessage) {
      // handle delete message by deleting the message id 
    } 
    event.id = uuidv4()
    const newMessage = convertEventToMessage(event)
    setMessages(msgs => [...msgs, newMessage])
  }

  return {
    onInitialMessagesLoaded,
    onMessagesDiff,
    onNewEvent,
    messages,
    localData
  }
}
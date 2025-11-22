import { CoreAction, CoreMessageType } from "./common";
import { Event, Message } from "./model"

export const convertEventToMessage = (event: Event): Message => {
  const message: Message = {
    id: "", // placeholder id 
    timestamp: new Date(),
    author: event.author,
  }

  if (event.id) {
    // by now we will have an id
    message.id = event.id
  }

  if (event.content) {
    message.content = event.content
  }

  if (event.action == CoreAction.sendMessage) {
    message.type = CoreMessageType.message
  } else if (event.action == CoreAction.editMessage) {
    message.type = CoreMessageType.edit
  } else if (event.action == CoreAction.deleteMessage) {
    message.type = CoreMessageType.delete
  }

  if (event.props) {
    message.props = event.props
  }

  return message
}

export const applyMessageUpdate = (message: Message, update: Message | string) => {
  if (typeof update === "string") {
    message.content = update;
    return;
  }

  Object.assign(message, update);
}
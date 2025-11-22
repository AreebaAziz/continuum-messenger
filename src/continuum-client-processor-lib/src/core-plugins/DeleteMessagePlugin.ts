import { CoreAction, CoreMessageType } from "../common";
import { EditMessage, Event } from "../model";
import { Plugin } from "../plugin";

export const DeleteMessagePlugin: Plugin = {
  onNewEvent: (event: Event) => {
    console.log("from delete msg plugin", event)

    if (event.action === CoreAction.deleteMessage && typeof event.props?.messageId === 'string') {
      console.log("from plugin, msg id", event.props?.messageId)
      return {
        changes: {
          updateLocalMessages: (messages) => {
            let edits: EditMessage[] = []
            messages.filter(msg => msg.id === event.props?.messageId).forEach(msg => {
              if (msg.author?.uid !== 'me') {
                return // only delete your own messages.
                // TODO find better way to determine own messages
              }
              edits.push({
                messageId: msg.id,
                newMessageOrContent: {
                  ...msg, 
                  type: CoreMessageType.deletedMessage,
                  content: "",
                  props: {}
                }
              })
            })
            return edits
          }
        },
        event
      }
    }

    return {changes: {}, event}
  }
}
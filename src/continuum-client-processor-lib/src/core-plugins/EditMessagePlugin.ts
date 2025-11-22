import { Plugin } from "../plugin"
import { EditMessage, Event } from "../model"
import { CoreAction } from "../common"

export const EditMessagePlugin: Plugin = {
  onNewEvent: (event: Event) => {

    if (event.action === CoreAction.editMessage) {
      return {
        changes: {
          updateLocalMessages: (messages) => {
            let edits: EditMessage[] = []
            messages.filter(msg => msg.id === event.props?.messageId && msg.content !== event.props?.newContent).forEach(msg => {
              edits.push({
                messageId: msg.id,
                newMessageOrContent: {
                  ...msg,
                  content: event.props?.newContent,
                  props: {
                    ...msg.props,
                    messageHistory: [
                      ...msg.props?.messageHistory || [],
                      msg.content
                    ]
                  }
                }
              })
            })
            return edits
          }
        },
        event
      }

    }
    return {
      changes: {}, event
    }
  }
}
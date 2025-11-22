import { Changes, Event } from "./model";

export interface OnNewEventOutput {
  changes: Changes,
  event: Event
}

export interface Plugin {
  onInitialMessagesLoaded?: Changes,
  onMessagesDiff?: Changes,
  onNewEvent?: (event: Event) => OnNewEventOutput
}
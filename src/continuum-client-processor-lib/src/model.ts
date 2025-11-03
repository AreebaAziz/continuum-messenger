export interface Message {
  id: string, 
  timestamp: Date,
  content?: string, 
  author?: Author,
  type?: string,
  props?: Record<string, any>
}

export interface Event {
  author: Author,
  action: string, 
  content?: string,
  id?: string, 
  timestamp?: Date, 
  props?: Record<string, any>
}

export interface Author {
  uid: string,
  displayName: string
}

export interface UpdateLocalMessageChange {
  messageId: string,
  newMessageContent: string
}

export interface Changes {
  updateLocalMessages: UpdateLocalMessageChange[],
  updateLocalData: Record<string, any>,
  postToLocalEventQueue: LocalEvent[]
}

export interface LocalEvent {
  action?: string,
  timestamp?: Date,
  props?: Record<string, any>
}
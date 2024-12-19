export interface Message {
  role: "user" | "assistant";
  content: string;
  tempId?: string; // ID temporal opcional para manejo de duplicados
}

export interface ChatHistory {
  id: string;
  timestamp: string;
  messages: Message[];
  summary?: string;
}

export enum MessageType {
  SEND_MESSAGE = "sendMessage",
  LOAD_CHAT = "loadChat",
  LOAD_HISTORY = "loadHistory",
  CLEAR_CONVERSATION = "clearConversation",
  RESPONSE = "response",
  ERROR = "error",
  CHAT_LOADED = "chatLoaded",
  MESSAGES_LOADED = "messagesLoaded",
  HISTORY_LOADED = "historyLoaded",
  CONVERSATION_CLEARED = "conversationCleared",
  PROJECT_FILES = "projectFiles"
}

export interface EventPayload {
  [MessageType.SEND_MESSAGE]: {
    message: string;
    selectedFiles: string[];
  };
  [MessageType.LOAD_CHAT]: {
    chatId: string;
  };
  [MessageType.LOAD_HISTORY]: {};
  [MessageType.CLEAR_CONVERSATION]: {};
  [MessageType.RESPONSE]: {
    message: string;
    done: boolean;
  };
  [MessageType.ERROR]: {
    message: string;
    code?: string;
    details?: any;
  };
  [MessageType.CHAT_LOADED]: {
    messages: Message[];
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
  };
  [MessageType.MESSAGES_LOADED]: {
    messages: Message[];
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
  };
  [MessageType.HISTORY_LOADED]: {
    history: ChatHistory[];
  };
  [MessageType.CONVERSATION_CLEARED]: {};
  [MessageType.PROJECT_FILES]: {
    files: string[];
  };
}

export type EventHandler<T extends MessageType> = (payload: EventPayload[T]) => void | Promise<void>;

export interface EventSubscription {
  unsubscribe: () => void;
}
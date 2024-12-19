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
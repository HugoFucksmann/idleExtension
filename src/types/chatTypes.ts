export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatHistory {
  id: string;
  timestamp: string;
  messages: Message[];
  summary?: string;
}

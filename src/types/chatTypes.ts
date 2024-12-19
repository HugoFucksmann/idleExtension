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

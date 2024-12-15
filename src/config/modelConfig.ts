export const modelConfig = {
  name: "qwen2.5-coder:7b",
  baseUrl: "http://localhost:11434",
  maxTokens: 12000,
  contextLength: 12000,
  apiEndpoint: "/api/generate",
  defaultHeaders: {
    "Content-Type": "application/json",
  },
};

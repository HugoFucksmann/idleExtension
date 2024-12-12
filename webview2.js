import React, { useState } from "react";
import ReactDOM from "react-dom";
import { ChatInput } from "./components/ChatInput";
import { ChatControls } from "./components/ChatControls";
import { ChatMessages } from "./components/ChatMessages";
import { Header } from "./components/Header";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "var(--vscode-sideBar-background)",
    color: "var(--vscode-foreground)",
  },
};

const vscode = acquireVsCodeApi();

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("chat");

  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      const newMessage = {
        id: Date.now().toString(),
        content: input,
        isUser: true,
      };
      setMessages((prev) => [...prev, newMessage]);
      setInput("");
      // Handle message sending to VS Code
      vscode.postMessage({ type: "sendMessage", message: input });
    }
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const handleClose = () => {
    vscode.postMessage({ type: "close" });
  };

  const handleImageUpload = () => {
    vscode.postMessage({ type: "uploadImage" });
  };

  const handleModelChange = (model) => {
    vscode.postMessage({ type: "modelChange", model });
  };

  return (
    <div style={styles.container}>
      <Header onNewChat={handleNewChat} onClose={handleClose} />
      <ChatMessages messages={messages} />
      <ChatControls
        onImageUpload={handleImageUpload}
        onModelChange={handleModelChange}
        mode={mode}
        onModeChange={setMode}
      />
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

window.addEventListener("load", () => {
  console.log("Load event fired");
  const root = document.getElementById("root");
  console.log("Root element:", root);
  if (root) {
    console.log("Attempting to render React app");
    ReactDOM.render(<Chat />, root);
    console.log("React app rendered");
  } else {
    console.error("Root element not found");
  }
});

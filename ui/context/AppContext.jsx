import React, { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext debe ser usado dentro de un AppProvider");
  }
  return context;
};

export const AppProvider = ({ children, vscode }) => {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");

  const handleSendMessage = async (message, files) => {
    if ((message.trim() !== "" || files.length > 0) && !isLoading) {
      setMessages(prev => [...prev, {
        text: message,
        isUser: true,
        attachedFiles: files
      }]);

      setIsLoading(true);
      try {
        vscode.postMessage({
          type: "sendMessage",
          message: message,
          selectedFiles: files,
          mode: mode
        });
      } catch (error) {
        console.error("Error sending message:", error);
        setIsLoading(false);
      }
      setInput("");
      setSelectedFiles([]);
    }
  };

  const handleResponseMessage = (message) => {
    if (!message.done) {
      setCurrentMessage(prev => prev + message.message);
    } else {
      setCurrentMessage(prev => {
        const finalMessage = prev + message.message;
        setMessages(prevMessages => [
          ...prevMessages,
          { text: finalMessage, isUser: false }
        ]);
        setIsLoading(false);
        return "";
      });
    }
  };

  const handleErrorMessage = (message) => {
    setMessages(prev => [
      ...prev,
      { text: message.message, isUser: false, isError: true }
    ]);
    setIsLoading(false);
    setCurrentMessage("");
  };

  const handleFileSelect = (file) => {
    if (!selectedFiles.includes(file)) {
      setSelectedFiles(prev => [...prev, file]);
    }
  };

  const handleRemoveFile = (file) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  const clearChat = () => {
    vscode.postMessage({ type: "clearConversation" });
    setMessages([]);
    setCurrentMessage("");
    setInput("");
    setSelectedFiles([]);
    setIsLoading(false);
  };

  useEffect(() => {
    const handleMessage = (event) => {
      const message = event.data;
      switch (message.type) {
        case "response":
          handleResponseMessage(message);
          break;
        case "error":
          handleErrorMessage(message);
          break;
        case "chatLoaded":
          setMessages(message.messages);
          break;
        case "conversationCleared":
          clearChat();
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const value = {
    vscode,
    input,
    setInput,
    selectedFiles,
    isLoading,
    messages,
    setMessages,
    currentMessage,
    mode,
    handleSendMessage,
    handleResponseMessage,
    handleErrorMessage,
    handleFileSelect,
    handleRemoveFile,
    handleModeChange,
    clearChat
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

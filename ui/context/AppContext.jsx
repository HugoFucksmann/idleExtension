import React, { createContext, useContext, useState, useEffect, useCallback, useReducer } from "react";

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext debe ser usado dentro de un AppProvider");
  }
  return context;
};

// Reducer para manejar estados de carga
const loadingReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_HISTORY_LOADING':
      return { ...state, isLoadingHistory: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'RESET':
      return { isLoading: false, isLoadingHistory: false, isInitialized: true };
    default:
      return state;
  }
};

export const AppProvider = ({ children, vscode }) => {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loadingState, dispatchLoading] = useReducer(loadingReducer, {
    isLoading: false,
    isLoadingHistory: false,
    isInitialized: false
  });
  const [mode, setMode] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [history, setHistory] = useState([]);
 
  const [showHistory, setShowHistory] = useState(false);
  const [projectFiles, setProjectFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const transformMessage = useCallback((message) => {
    if (message.role) {
      return {
        text: message.content,
        isUser: message.role === "user",
        attachedFiles: []
      };
    }
    return message;
  }, []);

  const handleSendMessage = useCallback(async (message, files) => {
    if ((message.trim() !== "" || files.length > 0) && !loadingState.isLoading) {
      setMessages(prev => [...prev, {
        text: message,
        isUser: true,
        attachedFiles: files
      }]);

      dispatchLoading({ type: 'SET_LOADING', payload: true });
      try {
        vscode.postMessage({
          type: "sendMessage",
          message: message,
          selectedFiles: files,
          mode: mode
        });
      } catch (error) {
        console.error("Error sending message:", error);
        dispatchLoading({ type: 'SET_LOADING', payload: false });
      }
      setInput("");
      setSelectedFiles([]);
    }
  }, [loadingState.isLoading, mode, vscode]);

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || currentPage >= totalPages - 1) return;
    
    setIsLoadingMore(true);
    try {
      vscode.postMessage({
        type: "loadMoreMessages",
        page: currentPage + 1
      });
    } catch (error) {
      console.error("Error loading more messages:", error);
    }
  }, [currentPage, totalPages, isLoadingMore, vscode]);

  const handleMessagesLoaded = useCallback((response) => {
    const { messages: newMessages, totalPages: total, currentPage: page } = response;
    setMessages(prev => {
      // Eliminar duplicados basados en índice temporal
      const combined = [...prev, ...newMessages.map(transformMessage)];
      const unique = Array.from(new Map(combined.map(m => [m.tempId, m])).values());
      return unique;
    });
    setTotalPages(total);
    setCurrentPage(page);
    setIsLoadingMore(false);
  }, [transformMessage]);

  const handleLoadChat = useCallback((chatId) => {
    if (!loadingState.isLoadingHistory) {
      dispatchLoading({ type: 'SET_HISTORY_LOADING', payload: true });
      setShowHistory(false);
      vscode.postMessage({
        type: "loadChat",
        chatId: chatId,
      });
    }
  }, [loadingState.isLoadingHistory, vscode]);

  const handleResponseMessage = useCallback((message) => {
    if (!message.done) {
      setCurrentMessage(message.message);
    } else {
      setMessages(prevMessages => [
        ...prevMessages,
        { text: message.message, isUser: false }
      ]);
      dispatchLoading({ type: 'SET_LOADING', payload: false });
      setCurrentMessage("");
    }
  }, []);

  const handleErrorMessage = useCallback((message) => {
    setMessages(prev => [
      ...prev,
      { text: message.message, isUser: false, isError: true }
    ]);
    dispatchLoading({ type: 'SET_LOADING', payload: false });
    setCurrentMessage("");
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentMessage("");
    setInput("");
    setSelectedFiles([]);
  
    dispatchLoading({ type: 'RESET' });
    vscode.postMessage({ type: "clearConversation" });
  }, [vscode]);

  const handleShowHistory = useCallback(() => {
    if (!loadingState.isLoadingHistory) {
      setShowHistory(true);
      dispatchLoading({ type: 'SET_HISTORY_LOADING', payload: true });
      vscode.postMessage({ type: "loadHistory" });
    }
  }, [loadingState.isLoadingHistory, vscode]);

  useEffect(() => {
    console.log("[AppContext] Initializing projectFiles state");
    
    const handleProjectFiles = (event) => {
      const message = event.data;
      if (message.type === "projectFiles") {
        console.log("[AppContext] Received project files:", message.files);
        setProjectFiles(message.files);
      }
    };

    window.addEventListener("message", handleProjectFiles);
    
    console.log("[AppContext] Requesting project files");
    vscode.postMessage({ type: "getProjectFiles" });

    return () => window.removeEventListener("message", handleProjectFiles);
  }, [vscode]);

  // Unified message handler
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
          if (message.messages && Array.isArray(message.messages)) {
            const transformedMessages = message.messages.map(transformMessage);
            setMessages(transformedMessages);
            dispatchLoading({ type: 'SET_HISTORY_LOADING', payload: false });
      
          }
          break;
          case "messagesLoaded":
            handleMessagesLoaded(message);
            break;
        case "historyLoaded":
          if (message.history && Array.isArray(message.history)) {
            setHistory(message.history);
          } else {
            setHistory([]);
          }
          dispatchLoading({ type: 'SET_HISTORY_LOADING', payload: false });
          break;
        case "conversationCleared":
          setMessages([]);
          setCurrentMessage("");
          setInput("");
          setSelectedFiles([]);
     
          dispatchLoading({ type: 'RESET' });
          break;
        case "projectFiles":
          setProjectFiles(message.files);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleResponseMessage, handleErrorMessage, transformMessage,handleMessagesLoaded]);

  // Initialize on mount
  useEffect(() => {
    if (!loadingState.isInitialized && !loadingState.isLoadingHistory) {
      dispatchLoading({ type: 'SET_INITIALIZED', payload: true });
      dispatchLoading({ type: 'SET_HISTORY_LOADING', payload: true });
      vscode.postMessage({ type: "loadHistory" });
    }
  }, [loadingState.isInitialized, loadingState.isLoadingHistory, vscode]);

  const value = {
    vscode,
    input,
    setInput,
    selectedFiles,
    setSelectedFiles,
    isLoading: loadingState.isLoading,
    isLoadingHistory: loadingState.isLoadingHistory,
    setIsLoadingHistory: (value) => 
      dispatchLoading({ type: 'SET_HISTORY_LOADING', payload: value }),
    mode,
    setMode,
    messages,
    setMessages,
    currentMessage,
    handleSendMessage,
    handleResponseMessage,
    handleErrorMessage,
    handleLoadChat,
    handleShowHistory,
    clearChat,
    history,
    setHistory,
    showHistory,
    setShowHistory,
    projectFiles,
    loadMoreMessages,
    isLoadingMore,
    hasMoreMessages: currentPage < totalPages - 1
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

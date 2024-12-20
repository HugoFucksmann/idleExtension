import React, { createContext, useContext, useState, useEffect, useCallback, useReducer } from "react";
import { MessageType } from "../../src/types/types";

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext debe ser usado dentro de un AppProvider");
  }
  return context;
};

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
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [projectFiles, setProjectFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const transformMessage = useCallback((message) => {
    return {
      text: message.content,
      isUser: message.role === "user",
      tempId: message.tempId || `${Date.now()}-${Math.random()}`,
      attachedFiles: message.attachedFiles || []
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      const message = event.data;
      if (message.type === 'response') {
        setMessages(prev => [
          ...prev,
          transformMessage({
            role: "assistant",
            content: message.content,
            tempId: `${Date.now()}-response`
          })
        ]);
        dispatchLoading({ type: 'SET_LOADING', payload: false });
      } else if (message.type === 'error') {
        vscode.window.showErrorMessage(`Error: ${message.content}`);
        dispatchLoading({ type: 'SET_LOADING', payload: false });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [transformMessage]);

  const sendMessage = useCallback(async (text, attachedFiles = [], model = "ollama") => {
    if (loadingState.isLoading) return;

    const tempId = `${Date.now()}-${Math.random()}`;
    const userMessage = {
      role: "user",
      content: text,
      tempId,
      attachedFiles
    };

    setMessages(prev => [...prev, transformMessage(userMessage)]);
    dispatchLoading({ type: 'SET_LOADING', payload: true });

    try {
      vscode.postMessage({
        command: 'sendMessage',
        text,
        attachedFiles,
        model
      });
    } catch (error) {
      console.error('Error sending message:', error);
      dispatchLoading({ type: 'SET_LOADING', payload: false });
    }
  }, [loadingState.isLoading, transformMessage]);

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || currentPage >= totalPages - 1) return;
    
    setIsLoadingMore(true);
    try {
      vscode.postMessage({
        type: MessageType.MESSAGES_LOADED,
        page: currentPage + 1
      });
    } catch (error) {
      console.error("Error loading more messages:", error);
      setIsLoadingMore(false);
    }
  }, [currentPage, totalPages, isLoadingMore, vscode]);

  const handleLoadChat = useCallback((chatId) => {
    if (!loadingState.isLoadingHistory) {
      dispatchLoading({ type: 'SET_HISTORY_LOADING', payload: true });
      setShowHistory(false);
      vscode.postMessage({
        type: MessageType.LOAD_CHAT,
        chatId
      });
    }
  }, [loadingState.isLoadingHistory, vscode]);

  useEffect(() => {
    const handleMessage = (event) => {
      const message = event.data;
      
      console.log('Received message in frontend:', message); // Debug log

      switch (message.type) {
        case MessageType.RESPONSE:
          if (!message.done) {
            setCurrentMessage(message.message);
          } else {
            setMessages(prevMessages => [
              ...prevMessages,
              { 
                text: message.message, 
                isUser: false,
                tempId: `${Date.now()}-${Math.random()}`
              }
            ]);
            dispatchLoading({ type: 'SET_LOADING', payload: false });
            setCurrentMessage("");
          }
          break;

        case MessageType.ERROR:
          setMessages(prev => [
            ...prev,
            { 
              text: message.message, 
              isUser: false, 
              isError: true,
              tempId: `error-${Date.now()}`,
              errorCode: message.code,
              errorDetails: message.details
            }
          ]);
          dispatchLoading({ type: 'SET_LOADING', payload: false });
          setCurrentMessage("");
          break;

        case MessageType.CHAT_LOADED:
          if (message.messages && Array.isArray(message.messages)) {
            const transformedMessages = message.messages.map(transformMessage);
            setMessages(transformedMessages);
            setTotalPages(message.totalPages || 1);
            setCurrentPage(message.currentPage || 0);
            dispatchLoading({ type: 'SET_HISTORY_LOADING', payload: false });
          }
          break;

        case MessageType.MESSAGES_LOADED:
          if (message.messages && Array.isArray(message.messages)) {
            setMessages(prev => {
              const transformedMessages = message.messages.map(transformMessage);
              const combined = [...prev, ...transformedMessages];
              return Array.from(
                new Map(combined.map(m => [m.tempId, m])).values()
              );
            });
            setTotalPages(message.totalPages || 1);
            setCurrentPage(message.currentPage || 0);
          }
          setIsLoadingMore(false);
          break;

        case MessageType.HISTORY_LOADED:
          if (message.history && Array.isArray(message.history)) {
            setHistory(message.history);
          } else {
            setHistory([]);
          }
          dispatchLoading({ type: 'SET_HISTORY_LOADING', payload: false });
          break;

        case MessageType.CONVERSATION_CLEARED:
          setMessages([]);
          setCurrentMessage("");
          setInput("");
          setSelectedFiles([]);
          dispatchLoading({ type: 'RESET' });
          break;

        case MessageType.PROJECT_FILES:
          setProjectFiles(message.files || []);
          break;

        case MessageType.SEND_MESSAGE:
          // Ignorar este mensaje ya que lo manejamos en handleSendMessage
          break;

        default:
          console.warn('Unknown message type:', message.type);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [transformMessage]);

  useEffect(() => {
    if (!loadingState.isInitialized) {
      dispatchLoading({ type: 'SET_INITIALIZED', payload: true });
      vscode.postMessage({ type: MessageType.PROJECT_FILES });
      vscode.postMessage({ type: MessageType.LOAD_HISTORY });
    }
  }, [loadingState.isInitialized, vscode]);

  const clearChat = useCallback(() => {
    vscode.postMessage({ type: MessageType.CLEAR_CONVERSATION });
  }, [vscode]);

  const handleShowHistory = useCallback(() => {
    if (!loadingState.isLoadingHistory) {
      setShowHistory(true);
      dispatchLoading({ type: 'SET_HISTORY_LOADING', payload: true });
      vscode.postMessage({ type: MessageType.LOAD_HISTORY });
    }
  }, [loadingState.isLoadingHistory, vscode]);

  const value = {
    input,
    setInput,
    selectedFiles,
    setSelectedFiles,
    isLoading: loadingState.isLoading,
    isLoadingHistory: loadingState.isLoadingHistory,
    messages,
    currentMessage,
    sendMessage,
    handleLoadChat,
    handleShowHistory,
    clearChat,
    history,
    showHistory,
    setShowHistory,
    projectFiles,
    loadMoreMessages,
    isLoadingMore,
    hasMoreMessages: currentPage < totalPages - 1
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

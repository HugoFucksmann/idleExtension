import React, { useRef, useEffect, memo, useCallback } from "react";
import { styles } from "./styles";
import { UserMessage } from "./Message/UserMessage";
import { AIMessage } from "./Message/AIMessage";
import { useAppContext } from '../../context/AppContext';

const Message = memo(({ message, messageIndex, onEdit }) => {
  return message.isUser ? (
    <UserMessage message={message} messageIndex={messageIndex} onEdit={onEdit} />
  ) : (
    <AIMessage message={message} />
  );
});

const ChatMessages = ({ children }) => {
  const { 
    messages, 
    isLoading, 
    currentMessage,
    handleSendMessage,
    loadMoreMessages,
    isLoadingMore,
    hasMoreMessages
  } = useAppContext();

  const containerRef = useRef(null);
  const lastMessageRef = useRef(null);
  const observerRef = useRef(null);

  const handleEditMessage = (messageIndex, newText, attachedFiles) => {
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      text: newText,
      attachedFiles: attachedFiles || []
    };
    handleSendMessage(newText, attachedFiles || []);
  };

  const handleScroll = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  useEffect(() => {
    if (!lastMessageRef.current) return;

    observerRef.current = new IntersectionObserver(handleScroll, {
      root: containerRef.current,
      threshold: 0.5,
    });

    observerRef.current.observe(lastMessageRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleScroll]);

  return (
    <div ref={containerRef} style={styles.chatContainer}>
      {isLoadingMore && (
        <div style={styles.loadingMore}>
          Cargando mensajes anteriores...
        </div>
      )}
      
      {messages.map((message, index) => (
        <div
          key={index}
          ref={index === messages.length - 1 ? lastMessageRef : null}
        >
          <Message
            message={message}
            messageIndex={index}
            onEdit={(newText, files) => handleEditMessage(index, newText, files)}
          />
        </div>
      ))}
      
      {isLoading && currentMessage && (
        <Message message={{ text: currentMessage, isUser: false }} />
      )}
      
      {messages.length === 0 && !isLoading && children}
    </div>
  );
};

export default ChatMessages;
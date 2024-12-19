
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

  const handleEditMessage = useCallback((messageIndex, newText, attachedFiles) => {
    handleSendMessage(newText, attachedFiles || []);
  }, [handleSendMessage]);

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
          key={message.tempId || index}
          ref={index === messages.length - 1 ? lastMessageRef : null}
        >
          <Message
            message={message}
            messageIndex={index}
            onEdit={handleEditMessage}
          />
        </div>
      ))}
      
      {isLoading && currentMessage && (
        <Message 
          message={{ 
            text: currentMessage, 
            isUser: false,
            tempId: 'current-message'
          }} 
        />
      )}
      
      {messages.length === 0 && !isLoading && children}
    </div>
  );
};

export default ChatMessages;
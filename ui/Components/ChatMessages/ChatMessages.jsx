import React, { useRef, useEffect, memo, useState } from "react";
import { styles } from "./styles";
import { UserMessage } from "./Message/UserMessage";
import { AIMessage } from "./Message/AIMessage";





const Message = memo(({ message, messageIndex, onEdit }) => {
  return message.isUser ? (
    <UserMessage message={message} messageIndex={messageIndex} onEdit={onEdit} />
  ) : (
    <AIMessage message={message} />
  );
});

// Componente principal de mensajes
const ChatMessages = ({ messages, isLoading, currentMessage, onEditMessage }) => {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollToBottom = () => {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      };
      setTimeout(scrollToBottom, 0);
    }
  }, [messages, currentMessage]);

  return (
    <div ref={chatContainerRef} style={styles.chatContainer}>
      {messages.map((msg, index) => (
        <Message
          key={index}
          message={msg}
          messageIndex={index}
          onEdit={onEditMessage}
        />
      ))}
      {isLoading && (
        <Message
          message={{
            text: currentMessage || "AI is thinking...",
            isUser: false,
          }}
        />
      )}
    </div>
  );
};

export default ChatMessages;

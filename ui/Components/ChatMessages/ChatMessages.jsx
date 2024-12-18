import React, { useRef, useEffect, memo } from "react";
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
const ChatMessages = ({ messages, isLoading, currentMessage, onEditMessage, children }) => {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollToBottom = () => {
        const { scrollHeight, clientHeight } = chatContainerRef.current;
        chatContainerRef.current.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: 'smooth'
        });
      };
      scrollToBottom();
    }
  }, [messages, currentMessage]);

  if (!messages || messages.length === 0) {
    return children ? (
      <div style={styles.emptyContainer}>{children}</div>
    ) : null;
  }

  return (
    <div ref={chatContainerRef} style={styles.chatContainer}>
      {messages.map((msg, index) => (
        <Message
          key={`${index}-${msg.text}`}
          message={msg}
          messageIndex={index}
          onEdit={onEditMessage}
        />
      ))}
      {isLoading && currentMessage && (
        <Message
          message={{
            text: currentMessage,
            isUser: false,
          }}
        />
      )}
    </div>
  );
};

export default ChatMessages;

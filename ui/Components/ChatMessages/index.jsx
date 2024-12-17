import React, { useRef, useEffect } from "react";
import { Message } from "./Message";
import { styles } from "./styles";

const ChatMessages = ({
  messages,
  isLoading,
  currentMessage,
  onEditMessage,
}) => {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollToBottom = () => {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
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

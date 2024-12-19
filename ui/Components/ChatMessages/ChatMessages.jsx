import React, { useRef, useEffect, memo } from "react";
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

// Componente principal de mensajes
const ChatMessages = ({ children }) => {
  const { 
    messages, 
    isLoading, 
    currentMessage,
    handleSendMessage
  } = useAppContext();

  const handleEditMessage = (messageIndex, newText, attachedFiles) => {
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      text: newText,
      attachedFiles: attachedFiles || []
    };
    handleSendMessage(newText, attachedFiles || []);
  };

  return (
    <div style={styles.container}>
      {messages.map((message, index) => (
        <Message
          key={index}
          message={message}
          onEdit={(newText, files) => handleEditMessage(index, newText, files)}
        />
      ))}
      {isLoading && currentMessage && (
        <Message message={{ text: currentMessage, isUser: false }} />
      )}
      {messages.length === 0 && !isLoading && children}
    </div>
  );
};

export default ChatMessages;

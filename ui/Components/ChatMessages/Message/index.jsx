import React from "react";
import { UserMessage } from "./UserMessage";
import { AIMessage } from "./AIMessage";

export const Message = ({ message, messageIndex, onEdit }) => {
  return message.isUser ? (
    <UserMessage
      message={message}
      messageIndex={messageIndex}
      onEdit={onEdit}
    />
  ) : (
    <AIMessage message={message} />
  );
};

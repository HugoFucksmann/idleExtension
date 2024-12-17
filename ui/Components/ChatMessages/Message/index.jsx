import React from "react";
import { UserMessage } from "./UserMessage";
import { AIMessage } from "./AIMessage";

export const Message = ({ message }) => {
  if (message.isUser) {
    return <UserMessage message={message} />;
  }
  return <AIMessage message={message} />;
};

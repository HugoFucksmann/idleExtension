import React from "react";
import { AttachedFiles } from "../AttachedFiles";
import { styles } from "../styles";

export const UserMessage = ({ message }) => {
  return (
    <div style={{ ...styles.message, ...styles.userMessage }}>
      <AttachedFiles files={message.attachedFiles} />
      <div>{message.text}</div>
    </div>
  );
};

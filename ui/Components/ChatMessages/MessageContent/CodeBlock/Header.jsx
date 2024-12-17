import React, { useState, useEffect } from "react";
import { IconTick } from "../../../../../Icons/Icons";
import { styles } from "../../styles";

export const CodeBlockHeader = ({ filename, language, onCopy }) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleCopy = () => {
    onCopy();
    setIsCopied(true);
  };

  return (
    <div style={styles.codeBlockHeader}>
      <span>{filename || language}</span>
      <button onClick={handleCopy} style={styles.copyButton}>
        {isCopied ? (
          <>
            <IconTick /> Copiado
          </>
        ) : (
          "Copy"
        )}
      </button>
    </div>
  );
};

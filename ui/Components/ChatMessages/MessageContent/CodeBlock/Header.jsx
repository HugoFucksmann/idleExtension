import React, { useState, useEffect } from "react";

import { styles } from "../../styles";

const IconTick = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

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

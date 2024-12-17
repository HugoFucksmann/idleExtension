import React, { useEffect } from "react";
import Prism from "prismjs";
import { styles } from "../../styles";

export const CodeBlockContent = ({ content, language }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  return (
    <pre style={styles.codeBlockContent}>
      <code className={`language-${language || "javascript"}`}>{content}</code>
    </pre>
  );
};

import React from "react";
import { CodeBlockHeader } from "./Header";
import { CodeBlockContent } from "./Content";
import { styles } from "../../styles";

export const CodeBlock = ({ content, language, filename }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div style={styles.codeBlock}>
      <CodeBlockHeader
        filename={filename}
        language={language}
        onCopy={handleCopy}
      />
      <CodeBlockContent content={content} language={language} />
    </div>
  );
};

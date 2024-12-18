import React, { memo, useState, useEffect } from "react";
import Prism from "prismjs";
import { styles } from "../styles";
import { useAppContext } from "../../../context/AppContext";
import { IconApply, IconCopy, IconTick } from "../../../IconstApp";


const PrismConfig = memo(() => {
  useEffect(() => {
    require("prismjs/components/prism-javascript");
    require("prismjs/components/prism-jsx");
    require("prismjs/components/prism-typescript");
    require("prismjs/components/prism-python");
    require("prismjs/components/prism-json");
    require("prismjs/components/prism-css");
    require("prismjs/components/prism-markdown");

    // Initialize Prism languages
    Prism.languages = {
      ...Prism.languages,
      javascript: Prism.languages.javascript,
      jsx: Prism.languages.jsx,
      typescript: Prism.languages.typescript,
      python: Prism.languages.python,
      json: Prism.languages.json,
      css: Prism.languages.css,
      markdown: Prism.languages.markdown
    };
  }, []);

  return null;
});


const CodeBlockHeader = memo(({ filename, onCopy, onApply }) => {
  const [copyState, setCopyState] = useState({ copied: false, timer: null });
  const [applyState, setApplyState] = useState({ applied: false, timer: null });

  const handleStateChange = async (action, state, setState) => {
    if (state.timer) clearTimeout(state.timer);
    
    await action();
    setState({
      [action === onCopy ? "copied" : "applied"]: true,
      timer: setTimeout(() => {
        setState({ [action === onCopy ? "copied" : "applied"]: false, timer: null });
      }, 2000),
    });
  };

  useEffect(() => {
    return () => {
      if (copyState.timer) clearTimeout(copyState.timer);
      if (applyState.timer) clearTimeout(applyState.timer);
    };
  }, []);

  return (
    <div style={styles.codeBlockHeader}>
      <span>{filename || "code.jsx"}</span>
      <div style={styles.buttonGroup}>
        <button
          onClick={() => handleStateChange(onApply, applyState, setApplyState)}
          style={{
            ...styles.copyButton,
            color: applyState.applied ? "#4CAF50" : "currentColor",
          }}
          title="Apply changes"
        >
          <IconApply />
        </button>
        <button
          onClick={() => handleStateChange(onCopy, copyState, setCopyState)}
          style={{
            ...styles.copyButton,
            color: copyState.copied ? "#4CAF50" : "currentColor",
          }}
          title="Copy code"
        >
          {copyState.copied ? <IconTick /> : <IconCopy />}
        </button>
      </div>
    </div>
  );
});

const CodeBlockContent = memo(({ content, language }) => {
  useEffect(() => {
    // Solo resaltar si hay contenido
    if (content?.trim()) {
      Prism.highlightAll();
    }
  }, [content]);

  return (
    <pre style={styles.codeBlockContent}>
      <code className={`language-${language || "javascript"}`}>{content}</code>
    </pre>
  );
});


const CodeBlock = memo(({ content, language, filename }) => {
  const { vscode } = useAppContext();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleApply = async () => {
    vscode.postMessage({
      type: "applyChanges",
      payload: {
        filename: filename || "code.jsx",
        content,
      },
    });
  };

  // No renderizar si no hay contenido
  if (!content?.trim()) return null;

  return (
    <div style={styles.codeBlock}>
      <PrismConfig />
      <CodeBlockHeader
        filename={filename}
        onCopy={handleCopy}
        onApply={handleApply}
      />
      <CodeBlockContent content={content} language={language} />
    </div>
  );
});

export default CodeBlock;

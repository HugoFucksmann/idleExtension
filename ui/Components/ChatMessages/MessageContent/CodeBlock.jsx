import React, { memo, useState, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css"; // Tema oscuro moderno
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markdown";
import { styles } from "../styles";
import { useAppContext } from "../../../context/AppContext";
import { IconApply, IconCopy, IconTick } from "../../../IconstApp";

const PrismConfig = memo(() => {
  useEffect(() => {
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
    setState(prev => ({
      [action === onCopy ? "copied" : "applied"]: true,
      timer: setTimeout(() => {
        setState(prev => ({ [action === onCopy ? "copied" : "applied"]: false, timer: null }));
      }, 2000),
    }));
  };

  return (
    <div style={styles.codeBlockHeader}>
      {filename && <span style={styles.filename}>{filename}</span>}
      <div style={styles.buttonContainer}>
        <button
          onClick={() => handleStateChange(onCopy, copyState, setCopyState)}
          style={styles.button}
          title="Copy code"
        >
          {copyState.copied ? <IconTick /> : <IconCopy />}
        </button>
        <button
          onClick={() => handleStateChange(onApply, applyState, setApplyState)}
          style={styles.button}
          title="Apply changes"
        >
          {applyState.applied ? <IconTick /> : <IconApply />}
        </button>
      </div>
    </div>
  );
});

const CodeBlock = ({ language = "javascript", content, filename }) => {
  const { vscode } = useAppContext();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [content, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch (err) {
      console.error("Failed to copy text:", err);
      return false;
    }
  };

  const handleApply = async () => {
    try {
      vscode.postMessage({
        command: 'applyChanges',
        content,
        filename
      });
      return true;
    } catch (err) {
      console.error("Failed to apply changes:", err);
      return false;
    }
  };

  // No renderizar si no hay contenido
  if (!content?.trim()) return null;

  return (
    <div style={styles.codeBlockContainer}>
      <PrismConfig />
      <CodeBlockHeader
        filename={filename}
        onCopy={handleCopy}
        onApply={handleApply}
      />
      <pre style={{
        ...styles.pre,
        backgroundColor: 'transparent',
        margin: 0,
        padding: '1em',
        borderRadius: '0 0 4px 4px',
        overflow: 'auto',
      }}>
        <code className={`language-${language}`} style={{
          fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          tabSize: 2,
        }}>
          {content}
        </code>
      </pre>
    </div>
  );
};

export default memo(CodeBlock);

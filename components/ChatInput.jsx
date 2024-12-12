import React from "react";

const styles = {
  inputContainer: {
    padding: "8px",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    backgroundColor: "var(--vscode-input-background)",
    color: "var(--vscode-input-foreground)",
    border: "1px solid var(--vscode-input-border)",
    borderRadius: "4px",
    fontSize: "14px",
  },
};

export function ChatInput({ value, onChange, onSubmit, isLoading }) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div style={styles.inputContainer}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        style={styles.input}
        placeholder="Ask anything (Ctrl+L), @ to mention"
        disabled={isLoading}
      />
    </div>
  );
}

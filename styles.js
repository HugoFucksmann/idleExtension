const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    color: "var(--vscode-foreground)",
    backgroundColor: "var(--vscode-sideBar-background)",
  },
  header: {
    padding: "10px",
    borderBottom: "1px solid var(--vscode-sideBar-border)",
    fontSize: "14px",
    fontWeight: "bold",
  },
  chatContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
  },
  message: {
    marginBottom: "10px",
    padding: "8px",
    borderRadius: "4px",
    maxWidth: "100%",
    wordWrap: "break-word",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "var(--vscode-button-background)",
    color: "var(--vscode-button-foreground)",
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "var(--vscode-editor-background)",
    border: "1px solid var(--vscode-input-border)",
  },
  codeBlock: {
    margin: "10px 0",
    padding: "10px",
    borderRadius: "4px",
    backgroundColor: "var(--vscode-editor-background)",
    border: "1px solid var(--vscode-input-border)",
    overflow: "auto",
  },
  inputContainer: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid var(--vscode-sideBar-border)",
  },
  input: {
    flex: 1,
    padding: "8px",
    marginRight: "10px",
    backgroundColor: "var(--vscode-input-background)",
    color: "var(--vscode-input-foreground)",
    border: "1px solid var(--vscode-input-border)",
    borderRadius: "4px",
  },
  button: {
    padding: "8px 16px",
    backgroundColor: "var(--vscode-button-background)",
    color: "var(--vscode-button-foreground)",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  error: {
    color: "var(--vscode-errorForeground)",
    padding: "8px",
    marginBottom: "10px",
    borderRadius: "4px",
    backgroundColor: "var(--vscode-inputValidation-errorBackground)",
    border: "1px solid var(--vscode-inputValidation-errorBorder)",
  },
};
  
  
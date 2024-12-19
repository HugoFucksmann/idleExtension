import React from "react";
import ReactDOM from "react-dom";
import Header from "./Components/Header";
import ChatInput from "./Components/InputChat/ChatInput";
import ChatHistory from "./Components/ChatHistory";
import RecentChats from "./Components/RecentChats";
import { AppProvider } from "./context/AppContext";
import ChatMessages from "./Components/ChatMessages/ChatMessages";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100%",  // Cambiado de "100vw" a "100%"
    color: "var(--vscode-foreground)",
    backgroundColor: "var(--vscode-sideBar-background)",
    overflow: "hidden",
    margin: 0,
    boxSizing: "border-box",  // Añadido
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
  }
};

// Componente principal simplificado que solo maneja la estructura
function Chat() {
  return (
    <div style={styles.container}>
      <Header />
      <ChatHistory />
      <div style={styles.content}>
        <ChatMessages>
          <RecentChats />
        </ChatMessages>
     
      </div>
      
      <ChatInput />
    </div>
  
  );
}

// Inicializar vscode una sola vez
const vscode = acquireVsCodeApi();

// Renderizar la aplicación
const root = document.getElementById("root");
ReactDOM.render(
  <AppProvider vscode={vscode}>
    <Chat />
  </AppProvider>,
  root
);

import React, { createContext, useContext } from "react";

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext debe ser usado dentro de un AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Obtener vscode API
  const vscode = acquireVsCodeApi();

  // Puedes agregar más estados globales aquí
  const value = {
    vscode,
    // Otros valores globales que quieras compartir
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

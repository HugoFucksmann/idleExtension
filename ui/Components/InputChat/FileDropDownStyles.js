export const styles = {
  dropdown: {
    position: "absolute",
    bottom: "100%", // Cambiado de 'top' a 'bottom'
    left: "0",
    width: "250px",
    maxHeight: "300px",
    overflowY: "auto",
    backgroundColor: "var(--vscode-input-background)",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1)", // Ajustado para sombra hacia arriba
    zIndex: 10,
    marginBottom: "4px", // Cambiado de marginTop a marginBottom
  },
  fileList: {
    listStyle: "none",
    margin: 0,
    padding: "4px 0",
  },
  fileItem: {
    padding: "6px 12px", // Reducido el padding vertical
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px", // Reducido el tamaño de la fuente
    color: "#f2f2f2",
    transition: "background-color 0.2s",
  },
  fileItemHover: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
  },
};

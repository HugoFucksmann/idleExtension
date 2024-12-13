const { spawn } = require("child_process");

class OllamaIntegrationAgent {
  constructor() {
    this.currentProcess = null;
  }

  async sendToOllama(userMessage) {
    // Matar cualquier proceso existente
    if (this.currentProcess) {
      this.currentProcess.kill();
    }

    // Crear un nuevo proceso para Ollama
    this.currentProcess = spawn("ollama", ["run", "qwen2.5-coder:7b"], {
      shell: true,
    });

    let fullResponse = "";
    let buffer = "";

    this.currentProcess.stdin.write(userMessage + "\n");
    this.currentProcess.stdin.end();

    this.currentProcess.stdout.on("data", (data) => {
      const text = data.toString();
      buffer += text;

      // Intentar encontrar líneas completas
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Mantener la línea incompleta en el búfer

      if (lines.length > 0) {
        fullResponse += lines.join("\n") + "\n";
        this.view.webview.postMessage({
          type: "receiveMessage",
          message: fullResponse,
          isPartial: true,
        });
      }
    });

    this.currentProcess.stderr.on("data", (data) => {
      // Registrar stderr pero no mostrarlo al usuario a menos que sea un error real
      console.log(`Ollama stderr: ${data}`);
    });

    this.currentProcess.on("error", (error) => {
      console.error("Failed to start Ollama process:", error);
      this.view.webview.postMessage({
        type: "error",
        message:
          "Failed to start Ollama process. Please make sure Ollama is installed and running.",
      });
    });

    this.currentProcess.on("close", (code) => {
      console.log(`Ollama process exited with code ${code}`);
      if (buffer) {
        fullResponse += buffer;
      }
      this.view.webview.postMessage({
        type: "receiveMessage",
        message: fullResponse,
        isPartial: false,
      });
      this.currentProcess = null;
    });
  }
}

module.exports = { OllamaIntegrationAgent };

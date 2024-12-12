const vscode = require('vscode');
const path = require('path');
const { spawn } = require('child_process');

function activate(context) {
    const provider = new AIChatViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(AIChatViewProvider.viewType, provider)
    );

    console.log('AI Chat extension is now active!');
}

class AIChatViewProvider {
    static viewType = 'aiChatSidebar';

    constructor(extensionUri) {
        this._extensionUri = extensionUri;
        this._currentProcess = null;
    }

    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'sendMessage':
                    await this.sendToOllama(data.message);
                    break;
            }
        });

        console.log('AI Chat webview has been resolved!');
    }

    async sendToOllama(userMessage) {
        // Kill any existing process
        if (this._currentProcess) {
            this._currentProcess.kill();
        }

        // Create a new process
        this._currentProcess = spawn('ollama', ['run', 'qwen2.5-coder:7b'], { shell: true });
        
        let fullResponse = '';
        let buffer = '';

        this._currentProcess.stdin.write(userMessage + '\n');
        this._currentProcess.stdin.end();

        this._currentProcess.stdout.on('data', (data) => {
            const text = data.toString();
            buffer += text;
            
            // Try to find complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the incomplete line in the buffer
            
            if (lines.length > 0) {
                fullResponse += lines.join('\n') + '\n';
                this._view.webview.postMessage({ 
                    type: 'receiveMessage', 
                    message: fullResponse,
                    isPartial: true 
                });
            }
        });

        this._currentProcess.stderr.on('data', (data) => {
            // Log stderr but don't show it to the user unless it's a real error
            console.log(`Ollama stderr: ${data}`);
        });

        this._currentProcess.on('error', (error) => {
            console.error('Failed to start Ollama process:', error);
            this._view.webview.postMessage({ 
                type: 'error', 
                message: 'Failed to start Ollama process. Please make sure Ollama is installed and running.' 
            });
        });

        this._currentProcess.on('close', (code) => {
            console.log(`Ollama process exited with code ${code}`);
            if (buffer) {
                fullResponse += buffer;
            }
            this._view.webview.postMessage({ 
                type: 'receiveMessage', 
                message: fullResponse,
                isPartial: false 
            });
            this._currentProcess = null;
        });
    }

    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview.js'));

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Chat</title>
                <style>
                    body {
                        padding: 0;
                        margin: 0;
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                    }
                </style>
            </head>
            <body>
                <div id="root"></div>
                <script src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}

module.exports = {
    activate
};


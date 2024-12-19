# Documentación de la Extensión VS Code - Chat AI

## Estructura General

La extensión está organizada en varios módulos que trabajan juntos para proporcionar una interfaz de chat con un modelo de IA (Ollama). 

### 1. Punto de Entrada
- `extension.ts`: Inicializa la extensión y registra el proveedor de vista web.

### 2. Servicios Principales
- `OllamaService.ts`: Coordina la comunicación entre diferentes componentes
- `OllamaAPI.ts`: Maneja las peticiones a la API de Ollama
- `ChatManager.ts`: Gestiona el estado de la conversación
- `ChatHistoryStorage.ts`: Maneja el almacenamiento persistente de conversaciones
- `MessageBroker.ts`: Gestiona la comunicación entre servicios y la UI

### 3. Utilidades y Configuración
- `IdGenerator.ts`: Genera IDs únicos para mensajes y chats
- `AppConfig.ts`: Centraliza la configuración del sistema
- `types.ts`: Define los tipos de mensajes del sistema

### 4. Agentes
- `FileSystemAgent.ts`: Gestiona operaciones de lectura y monitoreo de archivos
- `FileEditorAgent.ts`: Maneja operaciones de escritura y edición de archivos

### 5. Interfaz de Usuario
- `AIChatViewProvider.ts`: Gestiona la vista del webview
- `AppContext.jsx`: Maneja el estado y la comunicación del frontend

### 6. Tipos y Interfaces

#### Interfaces Principales
1. `Message`:
   - `role`: Define el origen del mensaje ("user" | "assistant")
   - `content`: Contenido del mensaje
   - `tempId`: ID temporal opcional para manejo de duplicados

2. `ChatHistory`:
   - `id`: Identificador único de la conversación
   - `timestamp`: Marca temporal
   - `messages`: Array de mensajes
   - `summary`: Resumen opcional

## Configuración Centralizada

### AppConfig
```typescript
export const AppConfig = {
  files: {
    cache: { 
      ttl: 5 * 60 * 1000,  // 5 minutos
      maxSize: 1024 * 1024 // 1MB
    },
    ignore: ['node_modules', '.git', 'build', 'dist']
  },
  chat: {
    pageSize: 50,
    timeoutMs: 30000,
    chunkSize: 1024 * 16
  },
  storage: {
    filename: 'chat-history.json'
  }
}
```

## Sistema de Mensajería

### MessageBroker
- Implementa el patrón Singleton
- Maneja toda la comunicación entre servicios y UI
- Tipos de mensajes soportados:
  ```typescript
  enum MessageType {
    SEND_MESSAGE = "sendMessage",
    LOAD_CHAT = "loadChat",
    LOAD_HISTORY = "loadHistory",
    CLEAR_CONVERSATION = "clearConversation",
    RESPONSE = "response",
    ERROR = "error",
    CHAT_LOADED = "chatLoaded",
    MESSAGES_LOADED = "messagesLoaded",
    HISTORY_LOADED = "historyLoaded",
    CONVERSATION_CLEARED = "conversationCleared",
    PROJECT_FILES = "projectFiles"
  }
  ```

## Generación de IDs

### IdGenerator
```typescript
export class IdGenerator {
  static generate(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
```

## Flujo de Trabajo Optimizado

1. Usuario interactúa con el webview
2. AppContext maneja el estado del frontend
3. MessageBroker gestiona la comunicación
4. Servicios procesan las peticiones usando:
   - AppConfig para configuración
   - IdGenerator para identificadores únicos
   - MessageBroker para comunicación uniforme
5. Resultados vuelven al usuario vía MessageBroker

## Características Técnicas

### Manejo de Estado
- Estado centralizado mediante MessageBroker
- Configuración unificada en AppConfig
- IDs únicos generados consistentemente

### Comunicación
- Sistema de mensajes tipado
- Patrón Singleton para MessageBroker
- Manejo uniforme de errores

### Rendimiento
- Configuración de timeouts y chunks optimizada
- Sistema de caché para archivos
- Paginación de mensajes

### Mantenibilidad
- Código modular y DRY
- Configuración centralizada
- Mejor organización y tipado

## Próximos Pasos
1. Implementar sistema de caché para archivos grandes
2. Mejorar el manejo de errores con tipos específicos
4. Optimizar la paginación de mensajes
5. Implementar compresión de mensajes largos
6. Rate Limiting
7. Streaming Mejorado
# Documentación de la Extensión VS Code - Chat AI

## Estructura General

La extensión está organizada en varios módulos que trabajan juntos para proporcionar una interfaz de chat con un modelo de IA (Ollama). Aquí está la estructura principal:

### 1. Punto de Entrada

- `extension.ts`: Inicializa la extensión y registra el proveedor de vista web.

### 2. Servicios Principales

- `OllamaService.ts`: Coordina la comunicación entre diferentes componentes
- `OllamaAPI.ts`: Maneja las peticiones a la API de Ollama
- `ChatManager.ts`: Gestiona el estado de la conversación
- `ChatHistoryStorage.ts`: Maneja el almacenamiento persistente de conversaciones

### 3. Interfaz de Usuario

- `AIChatViewProvider.ts`: Gestiona la vista del webview
- `webviewUtils.ts`: Proporciona utilidades para la generación del HTML del webview

### 4. Tipos y Interfaces

- `chatTypes.ts`: Define las interfaces principales que se utilizan en toda la aplicación

#### Interfaces Principales

1. `Message`:

   - Define la estructura de los mensajes en el chat
   - Propiedades:
     - `role`: Define el origen del mensaje ("user" | "assistant")
     - `content`: Contenido del mensaje en formato string

2. `ChatHistory`:
   - Define la estructura para almacenar el historial de conversaciones
   - Propiedades:
     - `id`: Identificador único de la conversación
     - `timestamp`: Marca temporal de la conversación
     - `messages`: Array de mensajes (tipo Message[])
     - `summary`: Resumen opcional de la conversación

## Relaciones y Flujo de Datos

graph TD
A[extension.ts] --> B[AIChatViewProvider]
B --> C[OllamaService]
C --> D[ChatManager]
C --> E[ChatHistoryStorage]
C --> F[OllamaAPI]

#### Uso de los Tipos

Estos tipos son fundamentales y se utilizan en:

- `ChatManager`: Para gestionar los mensajes actuales
- `ChatHistoryStorage`: Para el almacenamiento persistente
- `OllamaService`: Para el manejo de mensajes y respuestas
- `AIChatViewProvider`: Para la comunicación con el webview

## Responsabilidades Detalladas

### 1. AIChatViewProvider

- Gestiona la interfaz de usuario del chat
- Maneja los eventos y mensajes del webview
- Coordina la comunicación entre la UI y los servicios
- Implementa comandos como cargar historial y limpiar conversación

### 2. OllamaService

- Actúa como coordinador central
- Gestiona el flujo de mensajes entre el usuario y el modelo
- Coordina el almacenamiento y recuperación del historial
- Maneja errores y estados de la conversación

### 3. ChatManager

- Mantiene el estado actual de la conversación
- Gestiona el ID de chat actual
- Formatea los mensajes para la API
- Proporciona métodos para manipular la conversación

### 4. ChatHistoryStorage

- Maneja la persistencia de datos
- Guarda y carga el historial de conversaciones
- Genera resúmenes de conversaciones
- Gestiona el almacenamiento en el sistema de archivos

### 5. OllamaAPI

- Gestiona la comunicación con el servidor Ollama
- Implementa streaming de respuestas
- Maneja la cancelación de solicitudes
- Procesa las respuestas del modelo

## Flujo de Trabajo

1. El usuario interactúa con el webview
2. `AIChatViewProvider` recibe los eventos
3. Las solicitudes se envían a `OllamaService`
4. `OllamaService` coordina con:
   - `ChatManager` para gestionar el estado
   - `OllamaAPI` para comunicarse con el modelo
   - `ChatHistoryStorage` para persistencia

## Características Técnicas Destacables

- **Manejo de Streaming**: Implementación de respuestas en tiempo real
- **Persistencia de Datos**: Sistema robusto de almacenamiento local
- **Gestión de Estado**: Manejo eficiente del estado de la conversación
- **Control de Errores**: Sistema integral de manejo de errores
- **Arquitectura Modular**: Diseño altamente mantenible y extensible




export const AppConfig = {
  files: {
    cache: {
      ttl: 5 * 60 * 1000, // 5 minutos
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

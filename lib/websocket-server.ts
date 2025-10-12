import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'

let wss: WebSocketServer | null = null
const clients = new Set<WebSocket>()

interface ActivityMessage {
  type: 'activity'
  data: {
    id: string
    agent: string
    action: string
    details: string
    level: 'info' | 'warning' | 'error'
    createdAt: string
  }
}

/**
 * Initialize WebSocket server on specified port
 * @param port - Port number (default: 3001)
 */
export function initWebSocketServer(port: number = 3001): WebSocketServer {
  if (wss) {
    console.log('[WebSocket] Server already running')
    return wss
  }

  // Create HTTP server for WebSocket upgrade
  const server = createServer()
  wss = new WebSocketServer({ server })

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] New client connected. Total clients:', clients.size + 1)
    clients.add(ws)

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: 'connected',
        message: 'Connected to activity log stream',
        timestamp: new Date().toISOString(),
      })
    )

    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString())
        console.log('[WebSocket] Received message:', data)

        // Handle ping/pong for connection health
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }))
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error)
      }
    })

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected. Total clients:', clients.size - 1)
      clients.delete(ws)
    })

    ws.on('error', (error) => {
      console.error('[WebSocket] Client error:', error)
      clients.delete(ws)
    })
  })

  server.listen(port, () => {
    console.log(`[WebSocket] Server started on port ${port}`)
  })

  return wss
}

/**
 * Broadcast activity log to all connected clients
 * @param log - Activity log entry to broadcast
 */
export function broadcastActivity(log: ActivityMessage['data']): void {
  if (!wss || clients.size === 0) {
    console.log('[WebSocket] No clients connected, skipping broadcast')
    return
  }

  const message: ActivityMessage = {
    type: 'activity',
    data: log,
  }

  const payload = JSON.stringify(message)
  let successCount = 0
  let failCount = 0

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload)
        successCount++
      } catch (error) {
        console.error('[WebSocket] Error sending to client:', error)
        failCount++
      }
    } else {
      // Clean up closed connections
      clients.delete(client)
    }
  })

  console.log(
    `[WebSocket] Broadcasted activity log to ${successCount} client(s), ${failCount} failed`
  )
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): WebSocketServer | null {
  return wss
}

/**
 * Get number of connected clients
 */
export function getConnectedClientsCount(): number {
  return clients.size
}

/**
 * Close WebSocket server
 */
export function closeWebSocketServer(): void {
  if (wss) {
    clients.forEach((client) => {
      client.close()
    })
    clients.clear()
    wss.close()
    wss = null
    console.log('[WebSocket] Server closed')
  }
}

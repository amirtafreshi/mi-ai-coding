/**
 * Custom Next.js Server with WebSocket Support
 *
 * This server combines the Next.js application server with a WebSocket server
 * for real-time activity log updates. It's required because the standard Next.js
 * server doesn't support custom WebSocket servers.
 *
 * Architecture:
 * - Next.js server runs on APP_PORT (default: 3000) for HTTP requests
 * - WebSocket server runs on WS_PORT (default: 3001) for real-time updates
 * - Both servers bind to 0.0.0.0 for external access
 *
 * Usage:
 *   Development: npm run dev (starts with NODE_ENV=development)
 *   Production:  npm start (requires npm run build first)
 *
 * @module server
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server: WebSocketServer } = require('ws')

// Server configuration from environment variables
const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0' // Bind to all interfaces for external access
const port = parseInt(process.env.APP_PORT || '3000', 10)
const wsPort = parseInt(process.env.WS_PORT || '3001', 10)

// Initialize Next.js application
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

/**
 * Set of connected WebSocket clients
 * Used for broadcasting activity log updates to all connected browsers
 * @type {Set<WebSocket>}
 */
const clients = new Set()

app.prepare().then(() => {
  // Create HTTP server for Next.js
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Create WebSocket server
  const wsServer = createServer()
  const wss = new WebSocketServer({ server: wsServer })

  wss.on('connection', (ws) => {
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

    ws.on('message', (message) => {
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

  /**
   * Broadcast activity log to all connected WebSocket clients
   *
   * This function is exposed globally so that API routes can call it
   * after creating activity log entries in the database.
   *
   * The function:
   * 1. Wraps the log in a message envelope with type 'activity'
   * 2. Sends to all clients with readyState OPEN (1)
   * 3. Removes disconnected clients from the set
   * 4. Logs success/failure counts
   *
   * @global
   * @param {Object} log - Activity log object from database
   * @param {string} log.id - Unique log ID
   * @param {string} log.agent - Agent name that created the log
   * @param {string} log.action - Action performed
   * @param {string} log.details - Detailed description
   * @param {string} log.level - Log level (info/warning/error)
   * @param {Date} log.createdAt - Timestamp
   *
   * @example
   * // From an API route:
   * const log = await prisma.activityLog.create({ data: { ... } })
   * global.broadcastActivity(log)
   */
  global.broadcastActivity = (log) => {
    if (clients.size === 0) {
      console.log('[WebSocket] No clients connected, skipping broadcast')
      return
    }

    const message = {
      type: 'activity',
      data: log,
    }

    const payload = JSON.stringify(message)
    let successCount = 0
    let failCount = 0

    clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(payload)
          successCount++
        } catch (error) {
          console.error('[WebSocket] Error sending to client:', error)
          failCount++
        }
      } else {
        clients.delete(client)
      }
    })

    console.log(
      `[WebSocket] Broadcasted activity log to ${successCount} client(s), ${failCount} failed`
    )
  }

  // Start WebSocket server on all interfaces
  wsServer.listen(wsPort, '0.0.0.0', () => {
    console.log(`> WebSocket server ready on http://${hostname}:${wsPort}`)
  })

  // Start Next.js server
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Next.js ready on http://${hostname}:${port}`)
  })
})

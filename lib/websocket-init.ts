/**
 * WebSocket Server Initialization Script
 *
 * This script initializes the WebSocket server for real-time activity log updates.
 * It should be run once when the application starts (in server.ts or next.config.js).
 */

import { initWebSocketServer } from './websocket-server'

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10)

// Initialize WebSocket server only in development or production server mode
// Not in build mode or when running in serverless environment
if (process.env.NODE_ENV !== 'test' && typeof window === 'undefined') {
  try {
    initWebSocketServer(WS_PORT)
    console.log(`[WebSocket Init] Successfully started on port ${WS_PORT}`)
  } catch (error) {
    console.error('[WebSocket Init] Failed to start server:', error)
  }
}

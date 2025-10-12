'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, Tag, Space, Button, Select, Badge } from 'antd'
import { ReloadOutlined, ClearOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons'

interface ActivityLogEntry {
  id: string
  userId?: string
  user?: {
    email: string
    name: string | null
  }
  agent: string
  action: string
  details: string
  level: 'info' | 'warning' | 'error'
  createdAt: string
}

const levelColors = {
  info: 'blue',
  warning: 'orange',
  error: 'red',
}

export function ActivityStream() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLogEntry[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [wsConnected, setWsConnected] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadLogs()
    connectWebSocket()

    return () => {
      // Cleanup WebSocket connection on unmount
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, selectedAgent, selectedLevel])

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLogs, autoScroll])

  const connectWebSocket = () => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
    }

    try {
      const wsUrl = `ws://${window.location.hostname}:3001`
      console.log('[ActivityStream] Connecting to WebSocket:', wsUrl)
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[ActivityStream] WebSocket connected')
        setWsConnected(true)
      }

      ws.onmessage = (event) => {
        // Use requestAnimationFrame to defer processing and avoid blocking render
        requestAnimationFrame(() => {
          try {
            const message = JSON.parse(event.data)
            console.log('[ActivityStream] Received message:', message)

            if (message.type === 'activity') {
              // Add new log entry to the list
              setLogs((prevLogs) => [...prevLogs, message.data])
            } else if (message.type === 'connected') {
              console.log('[ActivityStream]', message.message)
            }
          } catch (error) {
            console.error('[ActivityStream] Error parsing WebSocket message:', error)
          }
        })
      }

      ws.onerror = (error) => {
        console.error('[ActivityStream] WebSocket error:', error)
        setWsConnected(false)
      }

      ws.onclose = () => {
        console.log('[ActivityStream] WebSocket disconnected')
        setWsConnected(false)

        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[ActivityStream] Attempting to reconnect...')
          connectWebSocket()
        }, 5000)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('[ActivityStream] Error creating WebSocket:', error)
      setWsConnected(false)
    }
  }

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/activity?limit=100')
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error loading activity logs:', error)
    }
  }

  const filterLogs = () => {
    let filtered = logs

    if (selectedAgent !== 'all') {
      filtered = filtered.filter((log) => log.agent === selectedAgent)
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter((log) => log.level === selectedLevel)
    }

    setFilteredLogs(filtered)
  }

  const clearLogs = () => {
    setLogs([])
    setFilteredLogs([])
  }

  const agents = Array.from(new Set(logs.map((log) => log.agent)))

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      // Show time only for today
      return date.toLocaleTimeString()
    } else {
      // Show full date and time for older entries
      return date.toLocaleString()
    }
  }

  return (
    <Card
      title={
        <Space>
          Activity Log
          <Badge
            status={wsConnected ? 'success' : 'error'}
            text={wsConnected ? 'Live' : 'Disconnected'}
          />
        </Space>
      }
      className="h-full flex flex-col"
      extra={
        <Space>
          <Select
            size="small"
            value={selectedAgent}
            onChange={setSelectedAgent}
            style={{ width: 150 }}
            options={[
              { label: 'All Agents', value: 'all' },
              ...agents.map((agent) => ({ label: agent, value: agent })),
            ]}
          />
          <Select
            size="small"
            value={selectedLevel}
            onChange={setSelectedLevel}
            style={{ width: 120 }}
            options={[
              { label: 'All Levels', value: 'all' },
              { label: 'Info', value: 'info' },
              { label: 'Warning', value: 'warning' },
              { label: 'Error', value: 'error' },
            ]}
          />
          <Button
            size="small"
            icon={wsConnected ? <WifiOutlined /> : <DisconnectOutlined />}
            onClick={connectWebSocket}
            title={wsConnected ? 'Connected' : 'Reconnect'}
            type={wsConnected ? 'default' : 'primary'}
          />
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={loadLogs}
            title="Refresh"
          />
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={clearLogs}
            danger
            title="Clear logs"
          />
        </Space>
      }
    >
      <div
        ref={logContainerRef}
        className="activity-log flex-1 overflow-auto bg-gray-50 p-2 rounded"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            No activity logs yet. Actions will appear here in real-time.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className={`activity-log-entry ${log.level} mb-2`}>
              <Space size="small" className="w-full">
                <span className="text-xs text-gray-500">
                  {formatTimestamp(log.createdAt)}
                </span>
                <Tag color={levelColors[log.level]} className="m-0">
                  {log.level.toUpperCase()}
                </Tag>
                <Tag className="m-0">{log.agent}</Tag>
                {log.user && (
                  <Tag color="purple" className="m-0">
                    {log.user.name || log.user.email}
                  </Tag>
                )}
                <span className="font-semibold">{log.action}</span>
              </Space>
              <div className="text-sm text-gray-600 mt-1 ml-2">
                {log.details}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

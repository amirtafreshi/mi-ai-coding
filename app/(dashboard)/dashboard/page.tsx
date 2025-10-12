'use client'

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { FileTree } from '@/components/file-explorer/FileTree'
import { VNCViewerDynamic } from '@/components/vnc/VNCViewerDynamic'
import { ActivityStream } from '@/components/activity-log/ActivityStream'
import { MonacoEditor } from '@/components/code-editor/MonacoEditor'
import { Card, Tabs, Button } from 'antd'
import { useState, useEffect } from 'react'
import {
  FileOutlined,
  CodeOutlined,
  DesktopOutlined,
  UnorderedListOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'

export default function DashboardPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [fileExplorerCollapsed, setFileExplorerCollapsed] = useState(false)
  const [activityLogCollapsed, setActivityLogCollapsed] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load collapsed state from localStorage
  useEffect(() => {
    const fileExplorerState = localStorage.getItem('fileExplorerCollapsed')
    const activityLogState = localStorage.getItem('activityLogCollapsed')
    if (fileExplorerState) setFileExplorerCollapsed(fileExplorerState === 'true')
    if (activityLogState) setActivityLogCollapsed(activityLogState === 'true')
  }, [])

  const toggleFileExplorer = () => {
    const newState = !fileExplorerCollapsed
    setFileExplorerCollapsed(newState)
    localStorage.setItem('fileExplorerCollapsed', String(newState))
  }

  const toggleActivityLog = () => {
    const newState = !activityLogCollapsed
    setActivityLogCollapsed(newState)
    localStorage.setItem('activityLogCollapsed', String(newState))
  }

  // Mobile layout: Tabbed interface
  if (isMobile) {
    const items = [
      {
        key: 'vnc',
        label: (
          <span>
            <DesktopOutlined /> VNC
          </span>
        ),
        children: (
          <div
            className="h-[calc(100vh-180px)] overflow-auto"
            style={{
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: '#888 #f1f1f1'
            }}
          >
            <style dangerouslySetInnerHTML={{__html: `
              .vnc-mobile-scroll::-webkit-scrollbar {
                width: 12px;
              }
              .vnc-mobile-scroll::-webkit-scrollbar-track {
                background: #f1f1f1;
              }
              .vnc-mobile-scroll::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 6px;
              }
              .vnc-mobile-scroll::-webkit-scrollbar-thumb:hover {
                background: #555;
              }
            `}} />
            <div className="vnc-mobile-scroll" style={{ minWidth: '100%' }}>
              <PanelGroup direction="vertical">
                <Panel defaultSize={50} minSize={30}>
                  <div className="h-full p-1">
                    <VNCViewerDynamic
                      display=":98"
                      port={6081}
                      title="Terminal VNC (:98)"
                    />
                  </div>
                </Panel>
                <PanelResizeHandle className="h-1 bg-gray-200" />
                <Panel defaultSize={50} minSize={30}>
                  <div className="h-full p-1">
                    <VNCViewerDynamic
                      display=":99"
                      port={6080}
                      title="Playwright VNC (:99)"
                    />
                  </div>
                </Panel>
              </PanelGroup>
            </div>
          </div>
        ),
      },
      {
        key: 'editor',
        label: (
          <span>
            <CodeOutlined /> Editor
          </span>
        ),
        children: (
          <div
            className="h-[calc(100vh-180px)] overflow-auto p-1"
            style={{
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin'
            }}
          >
            <MonacoEditor />
          </div>
        ),
      },
      {
        key: 'files',
        label: (
          <span>
            <FileOutlined /> Files
          </span>
        ),
        children: (
          <div
            className="h-[calc(100vh-180px)] overflow-auto p-1"
            style={{
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin'
            }}
          >
            <Card className="h-full" title="File Explorer">
              <FileTree />
            </Card>
          </div>
        ),
      },
      {
        key: 'activity',
        label: (
          <span>
            <UnorderedListOutlined /> Activity
          </span>
        ),
        children: (
          <div
            className="h-[calc(100vh-180px)] overflow-auto p-1"
            style={{
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin'
            }}
          >
            <ActivityStream />
          </div>
        ),
      },
    ]

    return (
      <div className="h-full overflow-hidden">
        <Tabs
          defaultActiveKey="vnc"
          items={items}
          type="card"
          size="small"
          className="h-full"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        />
      </div>
    )
  }

  // Desktop layout: Resizable panels
  return (
    <PanelGroup direction="horizontal" autoSaveId="dashboard-horizontal-layout" className="h-full">
      {/* Left Column: File Explorer */}
      {fileExplorerCollapsed ? (
        <div className="flex items-center justify-center w-8 bg-gray-100 border-r border-gray-200 flex-shrink-0">
          <Button
            type="text"
            size="small"
            icon={<MenuUnfoldOutlined />}
            onClick={toggleFileExplorer}
            title="Expand file explorer"
            className="rotate-0"
          />
        </div>
      ) : (
        <>
          <Panel
            id="file-explorer"
            defaultSize={20}
            minSize={15}
            maxSize={30}
            collapsible={false}
            order={1}
          >
            <div className="h-full m-2">
              <Card
                className="h-full"
                title="File Explorer"
                extra={
                  <Button
                    type="text"
                    size="small"
                    icon={<MenuFoldOutlined />}
                    onClick={toggleFileExplorer}
                    title="Collapse file explorer"
                  />
                }
              >
                <FileTree />
              </Card>
            </div>
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-500 transition-colors" />
        </>
      )}

      {/* Middle Column: Code Editor + VNC Views */}
      <Panel
        id="main-content"
        defaultSize={50}
        minSize={30}
        order={2}
      >
        <PanelGroup direction="vertical" autoSaveId="dashboard-vertical-layout">
          {/* VNC Views Side by Side - MOVED UP */}
          <Panel
            id="vnc-panel"
            defaultSize={60}
            minSize={30}
            order={1}
          >
            <PanelGroup direction="horizontal" autoSaveId="dashboard-vnc-layout">
              <Panel
                id="terminal-vnc"
                defaultSize={50}
                minSize={30}
                order={1}
              >
                <div className="h-full m-2">
                  <VNCViewerDynamic
                    display=":98"
                    port={6081}
                    title="Terminal VNC (:98)"
                  />
                </div>
              </Panel>

              <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-500 transition-colors" />

              <Panel
                id="playwright-vnc"
                defaultSize={50}
                minSize={30}
                order={2}
              >
                <div className="h-full m-2">
                  <VNCViewerDynamic
                    display=":99"
                    port={6080}
                    title="Playwright VNC (:99)"
                  />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="h-2 bg-gray-200 hover:bg-blue-500 transition-colors" />

          {/* Code Editor - MOVED DOWN */}
          <Panel
            id="code-editor"
            defaultSize={40}
            minSize={20}
            order={2}
          >
            <div className="h-full m-2">
              <MonacoEditor />
            </div>
          </Panel>
        </PanelGroup>
      </Panel>

      {/* Right Column: Activity Log */}
      {activityLogCollapsed ? (
        <div className="flex items-center justify-center w-8 bg-gray-100 border-l border-gray-200 flex-shrink-0">
          <Button
            type="text"
            size="small"
            icon={<MenuUnfoldOutlined />}
            onClick={toggleActivityLog}
            title="Expand activity log"
            className="rotate-0"
          />
        </div>
      ) : (
        <>
          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-500 transition-colors" />
          <Panel
            id="activity-log"
            defaultSize={30}
            minSize={20}
            maxSize={40}
            collapsible={false}
            order={3}
          >
            <div className="h-full m-2">
              <Card
                className="h-full"
                title={
                  <div className="flex items-center gap-2">
                    <Button
                      type="text"
                      size="small"
                      icon={<MenuFoldOutlined />}
                      onClick={toggleActivityLog}
                      title="Collapse activity log"
                    />
                    <span>Activity Log</span>
                  </div>
                }
              >
                <ActivityStream />
              </Card>
            </div>
          </Panel>
        </>
      )}
    </PanelGroup>
  )
}

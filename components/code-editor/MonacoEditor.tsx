'use client'

import { useEffect, useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { Card, Tabs, Button, Space, message, Modal, Input, Form, Select, App } from 'antd'
import { CloseOutlined, SaveOutlined, FileOutlined, SaveFilled, LockOutlined, CloseCircleOutlined, FullscreenOutlined, FullscreenExitOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type { TabsProps } from 'antd'
import { RefineModal } from '@/components/common/RefineModal'
import type { DocumentType } from '@/components/common/useDocumentRefine'

interface OpenFile {
  key: string
  path: string
  name: string
  content: string
  language: string
  isDirty: boolean
}

export function MonacoEditor() {
  const { modal } = App.useApp()
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activeKey, setActiveKey] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false)
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)
  const [saveAsPath, setSaveAsPath] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [form] = Form.useForm()
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false)
  const [refineFileContent, setRefineFileContent] = useState('')

  const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      json: 'json',
      md: 'markdown',
      css: 'css',
      scss: 'scss',
      html: 'html',
      py: 'python',
      sh: 'shell',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      sql: 'sql',
    }
    return languageMap[extension || ''] || 'plaintext'
  }

  const openFile = useCallback(async (path: string, name: string) => {
    // Check if file is already open
    setOpenFiles((prevFiles) => {
      const existing = prevFiles.find((f) => f.path === path)
      if (existing) {
        setActiveKey(existing.key)
        return prevFiles
      }
      return prevFiles
    })

    // Check again outside to avoid duplicate API calls
    const existing = openFiles.find((f) => f.path === path)
    if (existing) {
      return
    }

    try {
      // Load file content from API
      const response = await fetch(`/api/filesystem/read?path=${encodeURIComponent(path)}`)
      if (!response.ok) {
        const error = await response.json()
        message.error(error.error || 'Failed to load file')
        return
      }

      const data = await response.json()
      const newFile: OpenFile = {
        key: path,
        path,
        name,
        content: data.content,
        language: getLanguageFromPath(path),
        isDirty: false,
      }

      setOpenFiles((prevFiles) => [...prevFiles, newFile])
      setActiveKey(newFile.key)
      message.success(`Opened ${name}`)
    } catch (error) {
      console.error('Error loading file:', error)
      message.error('Failed to load file')
    }
  }, [openFiles])

  const closeFile = (key: string) => {
    const file = openFiles.find((f) => f.key === key)

    console.log('[MonacoEditor] closeFile called:', {
      key,
      fileName: file?.name,
      isDirty: file?.isDirty
    })

    const performClose = () => {
      const newFiles = openFiles.filter((f) => f.key !== key)
      setOpenFiles(newFiles)

      if (activeKey === key && newFiles.length > 0) {
        setActiveKey(newFiles[0].key)
      } else if (newFiles.length === 0) {
        setActiveKey('')
      }
    }

    if (file?.isDirty) {
      console.log('[MonacoEditor] Showing unsaved changes modal')
      const modalInstance = modal.confirm({
        title: 'Unsaved Changes',
        content: `"${file.name}" has unsaved changes. What would you like to do?`,
        zIndex: 10000,
        okText: 'Save & Close',
        cancelText: 'Cancel',
        okButtonProps: { type: 'primary' },
        footer: (_, { OkBtn, CancelBtn }) => (
          <>
            <CancelBtn />
            <Button
              danger
              onClick={() => {
                modalInstance.destroy()
                performClose()
              }}
            >
              Close Without Saving
            </Button>
            <OkBtn />
          </>
        ),
        onOk: async () => {
          await saveFile(key)
          performClose()
        },
        onCancel: () => {
          // Do nothing - just close the modal and let user continue editing
          console.log('[MonacoEditor] User cancelled, keeping file open')
        },
      })
    } else {
      console.log('[MonacoEditor] No unsaved changes, closing directly')
      performClose()
    }
  }

  const saveFile = useCallback(async (key: string) => {
    const file = openFiles.find((f) => f.key === key)
    if (!file) {
      console.log('[MonacoEditor] saveFile: file not found for key:', key)
      return
    }

    console.log('[MonacoEditor] Saving file:', file.name, 'isDirty:', file.isDirty)
    setSaving(true)
    try {
      const response = await fetch('/api/filesystem/write', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: file.path,
          content: file.content,
        }),
      })

      if (response.ok) {
        console.log('[MonacoEditor] File saved successfully, clearing isDirty flag')
        message.success(`Saved ${file.name}`)
        setOpenFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.key === key ? { ...f, isDirty: false } : f
          )
        )
      } else {
        const error = await response.json()
        console.error('[MonacoEditor] Save failed:', error)
        message.error(error.error || 'Failed to save file')
      }
    } catch (error) {
      console.error('[MonacoEditor] Error saving file:', error)
      message.error('Failed to save file')
    } finally {
      setSaving(false)
    }
  }, [openFiles])

  const handleEditorChange = (value: string | undefined, key: string) => {
    if (value === undefined) return

    console.log('[MonacoEditor] Content changed for:', key.split('/').pop())
    setOpenFiles((prevFiles) =>
      prevFiles.map((f) =>
        f.key === key ? { ...f, content: value, isDirty: true } : f
      )
    )
  }

  const handleSaveAs = () => {
    if (!activeFile) return
    setSaveAsPath(activeFile.path)
    setSaveAsModalOpen(true)
  }

  const performSaveAs = async () => {
    if (!activeFile || !saveAsPath.trim()) {
      message.error('Please enter a valid path')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/filesystem/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: saveAsPath,
          content: activeFile.content,
        }),
      })

      if (response.ok) {
        message.success(`File saved as ${saveAsPath}`)
        setSaveAsModalOpen(false)
        // Open the new file
        const fileName = saveAsPath.split('/').pop() || 'unnamed'
        openFile(saveAsPath, fileName)
      } else {
        const error = await response.json()
        message.error(error.error || 'Failed to save file')
      }
    } catch (error) {
      console.error('Error saving file as:', error)
      message.error('Failed to save file')
    } finally {
      setSaving(false)
    }
  }

  const handlePermissions = async () => {
    if (!activeFile) return

    try {
      // Fetch current permissions
      const response = await fetch(`/api/filesystem/permissions?path=${encodeURIComponent(activeFile.path)}`)
      if (response.ok) {
        const data = await response.json()
        form.setFieldsValue({
          mode: data.mode,
          owner: data.owner,
          group: data.group,
        })
        setPermissionsModalOpen(true)
      } else {
        message.error('Failed to load file permissions')
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
      message.error('Failed to load permissions')
    }
  }

  const performPermissionsChange = async (values: any) => {
    if (!activeFile) return

    setSaving(true)
    try {
      const response = await fetch('/api/filesystem/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: activeFile.path,
          mode: values.mode,
        }),
      })

      if (response.ok) {
        message.success('Permissions updated')
        setPermissionsModalOpen(false)
      } else {
        const error = await response.json()
        message.error(error.error || 'Failed to update permissions')
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      message.error('Failed to update permissions')
    } finally {
      setSaving(false)
    }
  }

  const handleCloseActiveFile = () => {
    if (activeKey) {
      closeFile(activeKey)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Detect file type from path
  const getFileType = (path: string): DocumentType => {
    if (path.includes('/.claude/agents/') || path.includes('/agents/')) {
      return 'agent'
    }
    if (path.includes('/.claude/skills/') || path.includes('/skills/')) {
      return 'skill'
    }
    return 'file'
  }

  // Handle refine button click
  const handleRefine = () => {
    if (!activeFile) return
    setRefineFileContent(activeFile.content)
    setIsRefineModalOpen(true)
  }

  // Handle successful refinement
  const handleRefineSuccess = (refinedContent: string) => {
    if (!activeFile) return

    // Update the file content in editor
    setOpenFiles((prevFiles) =>
      prevFiles.map((f) =>
        f.key === activeFile.key
          ? { ...f, content: refinedContent, isDirty: true }
          : f
      )
    )
    message.success('File refined successfully! Remember to save.')
  }

  const activeFile = openFiles.find((f) => f.key === activeKey)

  const tabItems: TabsProps['items'] = openFiles.map((file) => ({
    key: file.key,
    label: (
      <Space size={4}>
        <FileOutlined />
        <span>{file.name}</span>
        {file.isDirty && <span className="text-orange-500">●</span>}
      </Space>
    ),
    children: (
      <div className="h-full">
        <Editor
          height="calc(100vh - 250px)"
          language={file.language}
          value={file.content}
          onChange={(value) => handleEditorChange(value, file.key)}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            rulers: [80, 120],
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>
    ),
    closeIcon: <CloseOutlined />,
  }))

  // Listen for file:open events from FileTree
  // Use callback pattern to avoid stale closures
  useEffect(() => {
    const handleFileOpen = async (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string; name: string }>
      const { path, name } = customEvent.detail

      console.log('[MonacoEditor] Received file:open event:', path, name)

      // Check if file is already open
      const existing = openFiles.find((f) => f.path === path)
      if (existing) {
        setActiveKey(existing.key)
        console.log('[MonacoEditor] File already open, switching to tab')
        return
      }

      try {
        // Load file content from API
        const response = await fetch(`/api/filesystem/read?path=${encodeURIComponent(path)}`)
        if (!response.ok) {
          const error = await response.json()
          message.error(error.error || 'Failed to load file')
          return
        }

        const data = await response.json()
        const newFile: OpenFile = {
          key: path,
          path,
          name,
          content: data.content,
          language: getLanguageFromPath(path),
          isDirty: false,
        }

        setOpenFiles((prevFiles) => [...prevFiles, newFile])
        setActiveKey(newFile.key)
        message.success(`Opened ${name}`)
        console.log('[MonacoEditor] File opened successfully:', name)
      } catch (error) {
        console.error('[MonacoEditor] Error loading file:', error)
        message.error('Failed to load file')
      }
    }

    const handleFileClose = (e: Event) => {
      const { path } = (e as CustomEvent).detail
      console.log('[MonacoEditor] Received file:close event for:', path)

      // Close the file if it's open
      closeFile(path)
    }

    const handleFileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string; content: string }>
      const { path, content } = customEvent.detail
      console.log('[MonacoEditor] Received file:update event for:', path)

      // Update file content if it's open
      setOpenFiles((prevFiles) => {
        const fileIndex = prevFiles.findIndex((f) => f.path === path)
        if (fileIndex === -1) {
          console.log('[MonacoEditor] File not open, ignoring update')
          return prevFiles
        }

        console.log('[MonacoEditor] Updating file content and clearing dirty flag')
        return prevFiles.map((f) =>
          f.path === path ? { ...f, content, isDirty: false } : f
        )
      })

      message.success('File updated with refined content')
    }

    window.addEventListener('file:open', handleFileOpen)
    window.addEventListener('file:close', handleFileClose)
    window.addEventListener('file:update', handleFileUpdate)
    console.log('[MonacoEditor] Event listeners registered for file:open, file:close, and file:update')

    return () => {
      window.removeEventListener('file:open', handleFileOpen)
      window.removeEventListener('file:close', handleFileClose)
      window.removeEventListener('file:update', handleFileUpdate)
      console.log('[MonacoEditor] Event listeners unregistered')
    }
  }, [openFiles, getLanguageFromPath, closeFile])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (activeKey) {
          saveFile(activeKey)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeKey, saveFile])

  return (
    <Card
      className="h-full"
      title="Code Editor"
      extra={
        activeFile && (
          <Space size="small">
            <Button
              size="small"
              icon={<FullscreenOutlined />}
              onClick={toggleFullscreen}
            >
              Fullscreen
            </Button>
            <Button
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={handleRefine}
              disabled={!activeFile}
            >
              Refine with AI
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              onClick={() => saveFile(activeFile.key)}
              loading={saving}
              disabled={!activeFile.isDirty}
            >
              Save
            </Button>
            <Button
              size="small"
              icon={<SaveFilled />}
              onClick={handleSaveAs}
            >
              Save As
            </Button>
            <Button
              size="small"
              icon={<LockOutlined />}
              onClick={handlePermissions}
            >
              Permissions
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={handleCloseActiveFile}
            >
              Close
            </Button>
          </Space>
        )
      }
    >
      {openFiles.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <FileOutlined className="text-6xl mb-4 opacity-50" />
            <p className="text-lg">No files open</p>
            <p className="text-sm">Select a file from the file explorer to start editing</p>
          </div>
        </div>
      ) : (
        <Tabs
          type="editable-card"
          activeKey={activeKey}
          onChange={setActiveKey}
          onEdit={(targetKey, action) => {
            if (action === 'remove') {
              closeFile(targetKey as string)
            }
          }}
          items={tabItems}
          hideAdd
        />
      )}

      {/* Save As Modal */}
      <Modal
        title="Save File As"
        open={saveAsModalOpen}
        onOk={performSaveAs}
        onCancel={() => setSaveAsModalOpen(false)}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="New File Path">
            <Input
              value={saveAsPath}
              onChange={(e) => setSaveAsPath(e.target.value)}
              placeholder="/path/to/new/file.txt"
              autoFocus
            />
          </Form.Item>
          <p className="text-sm text-gray-500">
            Current file: {activeFile?.path}
          </p>
        </Form>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        title="File Permissions"
        open={permissionsModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setPermissionsModalOpen(false)}
        confirmLoading={saving}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={performPermissionsChange}
        >
          <Form.Item
            label="Permission Mode"
            name="mode"
            rules={[{ required: true, message: 'Please select permissions' }]}
            tooltip="Unix file permissions (e.g., 644 for rw-r--r--, 755 for rwxr-xr-x)"
          >
            <Select>
              <Select.Option value="644">644 (rw-r--r--) - Read/write for owner, read for others</Select.Option>
              <Select.Option value="664">664 (rw-rw-r--) - Read/write for owner and group</Select.Option>
              <Select.Option value="666">666 (rw-rw-rw-) - Read/write for everyone</Select.Option>
              <Select.Option value="755">755 (rwxr-xr-x) - Execute for everyone</Select.Option>
              <Select.Option value="775">775 (rwxrwxr-x) - Execute for owner and group</Select.Option>
              <Select.Option value="777">777 (rwxrwxrwx) - Full access for everyone</Select.Option>
              <Select.Option value="600">600 (rw-------) - Private file</Select.Option>
              <Select.Option value="400">400 (r--------) - Read-only private</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Owner" name="owner">
            <Input disabled />
          </Form.Item>
          <Form.Item label="Group" name="group">
            <Input disabled />
          </Form.Item>
          <p className="text-sm text-gray-500">
            File: {activeFile?.path}
          </p>
        </Form>
      </Modal>

      {/* Fullscreen Modal */}
      <Modal
        title={`Code Editor - ${activeFile?.name || 'No File'}`}
        open={isFullscreen}
        onCancel={toggleFullscreen}
        width="100%"
        style={{ top: 0, maxWidth: '100vw', padding: 0 }}
        styles={{ body: { height: 'calc(100vh - 110px)', padding: 0 } }}
        footer={
          activeFile && (
            <Space size="small">
              <Button
                icon={<FullscreenExitOutlined />}
                onClick={toggleFullscreen}
              >
                Exit Fullscreen
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => saveFile(activeFile.key)}
                loading={saving}
                disabled={!activeFile.isDirty}
              >
                Save
              </Button>
              <Button
                icon={<SaveFilled />}
                onClick={handleSaveAs}
              >
                Save As
              </Button>
              <Button
                icon={<LockOutlined />}
                onClick={handlePermissions}
              >
                Permissions
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleCloseActiveFile}
              >
                Close File
              </Button>
            </Space>
          )
        }
      >
        {activeFile && (
          <Tabs
            type="editable-card"
            activeKey={activeKey}
            onChange={setActiveKey}
            onEdit={(targetKey, action) => {
              if (action === 'remove') {
                closeFile(targetKey as string)
              }
            }}
            items={tabItems}
            hideAdd
            style={{ height: '100%' }}
            tabBarStyle={{ marginBottom: 0 }}
          />
        )}
      </Modal>

      {/* Refine Modal */}
      {activeFile && (
        <RefineModal
          open={isRefineModalOpen}
          fileName={activeFile.name}
          filePath={activeFile.path}
          fileType={getFileType(activeFile.path)}
          currentContent={refineFileContent}
          onClose={() => setIsRefineModalOpen(false)}
          onSuccess={handleRefineSuccess}
        />
      )}
    </Card>
  )
}

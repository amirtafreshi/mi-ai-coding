'use client'

import { useState, useEffect } from 'react'
import { Tree, Button, Input, Modal, message, Space, Segmented, Dropdown, App } from 'antd'
import type { DataNode, TreeProps } from 'antd/es/tree'
import type { MenuProps } from 'antd'
import {
  FolderOutlined,
  FolderOpenOutlined,
  FileOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  HomeOutlined,
  FolderFilled,
  CodeOutlined,
  MoreOutlined,
  RocketOutlined,
  ArrowUpOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { AgentDeployModal } from '@/components/agents/AgentDeployModal'
import { CreateAgentModal } from '@/components/agents/CreateAgentModal'
import { AgentEditorModal } from '@/components/agents/AgentEditorModal'
import { AgentSelectorModal } from '@/components/agents/AgentSelectorModal'
import { SkillDeployModal } from '@/components/skills/SkillDeployModal'
import { CreateSkillModal } from '@/components/skills/CreateSkillModal'
import { SkillEditorModal } from '@/components/skills/SkillEditorModal'
import { SkillSelectorModal } from '@/components/skills/SkillSelectorModal'
import { SkillResourceModal } from '@/components/skills/SkillResourceModal'
import { PathBreadcrumb } from './PathBreadcrumb'

interface FileNode {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  mimeType?: string
  parentId?: string | null
  updatedAt?: string
}

const QUICK_ACCESS = [
  { label: 'Root', value: '/', icon: <HomeOutlined /> },
  { label: 'Projects', value: '/home/master/projects', icon: <FolderFilled /> },
  { label: 'Agents', value: 'AGENT_SELECTOR', icon: <CodeOutlined /> },
  { label: 'Skills', value: 'SKILL_SELECTOR', icon: <ThunderboltOutlined /> },
]

export function FileTree() {
  const { modal } = App.useApp()
  const [treeData, setTreeData] = useState<DataNode[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file')
  const [currentPath, setCurrentPath] = useState<string>('/home/master/projects')
  const [isClient, setIsClient] = useState(false)
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false)
  const [deployAgentFile, setDeployAgentFile] = useState<string>('')
  const [isCreateAgentModalOpen, setIsCreateAgentModalOpen] = useState(false)
  const [isAgentEditorModalOpen, setIsAgentEditorModalOpen] = useState(false)
  const [editorAgentName, setEditorAgentName] = useState('')
  const [editorAgentDescription, setEditorAgentDescription] = useState('')
  const [editorFileName, setEditorFileName] = useState('')
  const [editorInitialContent, setEditorInitialContent] = useState('')
  const [editorSkipAI, setEditorSkipAI] = useState(false)
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false)

  // Skill states
  const [isSkillSelectorOpen, setIsSkillSelectorOpen] = useState(false)
  const [isCreateSkillModalOpen, setIsCreateSkillModalOpen] = useState(false)
  const [isSkillEditorModalOpen, setIsSkillEditorModalOpen] = useState(false)
  const [isSkillDeployModalOpen, setIsSkillDeployModalOpen] = useState(false)
  const [deploySkillFile, setDeploySkillFile] = useState<string>('')
  const [editorSkillName, setEditorSkillName] = useState('')
  const [editorSkillDescription, setEditorSkillDescription] = useState('')
  const [editorSkillFileName, setEditorSkillFileName] = useState('')
  const [editorSkillInitialContent, setEditorSkillInitialContent] = useState('')
  const [editorSkillSkipAI, setEditorSkillSkipAI] = useState(false)

  // Skill resource modal states
  const [isSkillResourceModalOpen, setIsSkillResourceModalOpen] = useState(false)
  const [resourceSkillName, setResourceSkillName] = useState('')
  const [resourceSkillPath, setResourceSkillPath] = useState('')
  const [resourcesPath, setResourcesPath] = useState('')

  // Hydrate client-side path from localStorage after mount
  useEffect(() => {
    setIsClient(true)
    const savedPath = localStorage.getItem('fileExplorerPath')
    if (savedPath) {
      setCurrentPath(savedPath)
    }
  }, [])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    loadFiles(currentPath)
    // Save current path to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('fileExplorerPath', currentPath)
    }
  }, [currentPath])

  const loadFiles = async (path: string) => {
    setLoading(true)
    try {
      console.log('[FileTree] Loading files from:', path)
      const response = await fetch(`/api/filesystem/browse?path=${encodeURIComponent(path)}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[FileTree] API error:', response.status, errorText)
        throw new Error('Failed to load directory')
      }

      const data = await response.json()
      console.log('[FileTree] Received data:', {
        path: data.path,
        entryCount: data.entries?.length,
        firstFew: data.entries?.slice(0, 3).map((e: any) => ({ name: e.name, isDir: e.isDirectory }))
      })

      const nodes = convertToTreeData(data.entries, path)
      console.log('[FileTree] Converted to tree nodes:', nodes.length, 'nodes')
      console.log('[FileTree] First few nodes:', nodes.slice(0, 3).map(n => ({ title: n.title, isLeaf: n.isLeaf })))
      setTreeData(nodes)
    } catch (error) {
      console.error('[FileTree] Error loading files:', error)
      message.error('Failed to load files')
      setTreeData([])
    } finally {
      setLoading(false)
    }
  }

  const convertToTreeData = (items: any[], basePath: string): DataNode[] => {
    if (!items || items.length === 0) {
      return [{
        key: 'empty',
        title: 'Empty directory',
        icon: <FolderOutlined />,
        disabled: true,
      }]
    }

    // Convert filesystem entries to tree nodes
    const nodes: DataNode[] = items.map((item) => {
      const fullPath = `${basePath}/${item.name}`.replace(/\/+/g, '/')
      const isDirectory = item.isDirectory

      // Detect agent files: .md files in /agents/ directory or its subdirectories
      const isInAgentsFolder = basePath.includes('/agents')
      const isAgentFile = isInAgentsFolder && item.name.endsWith('.md') && !isDirectory

      // Detect skill folders: directories in /skills/ that contain a SKILL.md file
      // We check if we're directly in /home/master/projects/skills (not nested)
      const isInSkillsFolder = basePath === '/home/master/projects/skills'
      const isSkillFolder = isInSkillsFolder && isDirectory && item.hasSkillMd === true

      const menuItems: MenuProps['items'] = [
        {
          key: 'delete',
          label: 'Delete',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: (info) => {
            console.log('[FileTree] Delete menu item clicked for:', item.name)
            info.domEvent.stopPropagation()
            info.domEvent.preventDefault()
            handleDelete({
              id: fullPath,
              name: item.name,
              path: fullPath,
              type: isDirectory ? 'folder' : 'file'
            })
          },
        },
      ]

      return {
        key: fullPath,
        title: (
          <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
            <div className="flex items-center justify-between w-full gap-2">
              <span className="truncate flex-1 flex items-center">
                {item.name}
              </span>
              <div className="flex gap-1">
                {isAgentFile && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<RocketOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeployAgentFile(item.name)
                      setIsDeployModalOpen(true)
                    }}
                    title="Deploy Agent"
                  />
                )}
                {isSkillFolder && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      // Use folder name as the skill name
                      setDeploySkillFile(item.name)
                      setIsSkillDeployModalOpen(true)
                    }}
                    title="Deploy Skill"
                  />
                )}
                <Dropdown
                  menu={{ items: menuItems }}
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<MoreOutlined />}
                    onClick={(e) => {
                      console.log('[FileTree] More button clicked for:', item.name)
                      e.stopPropagation()
                    }}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                  />
                </Dropdown>
              </div>
            </div>
          </Dropdown>
        ),
        icon: isDirectory ? <FolderOutlined /> : <FileOutlined />,
        isLeaf: !isDirectory,
        className: 'group',
      }
    })

    return nodes
  }

  const handleCreate = async () => {
    if (!newItemName.trim()) {
      message.error('Please enter a name')
      return
    }

    const newPath = currentPath === '/'
      ? `/${newItemName}`
      : `${currentPath}/${newItemName}`

    try {
      const endpoint = newItemType === 'file'
        ? '/api/filesystem/create-file'
        : '/api/filesystem/create-folder'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: newPath,
          name: newItemName,
          content: newItemType === 'file' ? '' : undefined,
        }),
      })

      if (response.ok) {
        message.success(`${newItemType === 'file' ? 'File' : 'Folder'} created successfully`)
        setIsCreateModalOpen(false)
        setNewItemName('')
        loadFiles(currentPath)
      } else {
        const error = await response.json()
        message.error(error.error || 'Failed to create item')
      }
    } catch (error) {
      console.error('Error creating item:', error)
      message.error('Failed to create item')
    }
  }

  const handleDelete = async (node: FileNode) => {
    console.log('[FileTree] handleDelete called for:', node)
    modal.confirm({
      title: `Delete ${node.type === 'file' ? 'file' : 'folder'}?`,
      content: (
        <div>
          <p>Are you sure you want to delete <strong>"{node.name}"</strong>?</p>
          {node.type === 'folder' && (
            <p className="text-red-500 text-sm mt-2">
              Warning: This will delete the folder and all its contents!
            </p>
          )}
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      centered: true,
      onOk: async () => {
        try {
          console.log('[FileTree] Deleting file/folder:', node.path)

          const endpoint = node.type === 'file'
            ? '/api/filesystem/delete-file'
            : '/api/filesystem/delete-folder'

          const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: node.path }),
          })

          if (response.ok) {
            console.log('[FileTree] Delete successful, closing editor if open')

            // Close the file in editor if it's open
            if (node.type === 'file') {
              const event = new CustomEvent('file:close', {
                detail: { path: node.path }
              })
              window.dispatchEvent(event)
            }

            message.success('Deleted successfully')

            // Refresh file explorer
            console.log('[FileTree] Refreshing file explorer')
            loadFiles(currentPath)
          } else {
            const error = await response.json()
            console.error('[FileTree] Delete failed:', error)
            message.error(error.error || 'Failed to delete')
          }
        } catch (error) {
          console.error('[FileTree] Error deleting:', error)
          message.error('Failed to delete')
        }
      },
    })
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) {
      return
    }

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })
      formData.append('targetPath', currentPath)

      const response = await fetch('/api/filesystem/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload files')
      }

      message.success(`Uploaded ${files.length} file(s) successfully!`)
      loadFiles(currentPath)
    } catch (error: any) {
      console.error('[FileTree] Upload error:', error)
      message.error(error.message || 'Failed to upload files')
    }
  }

  const contextMenuItems = (node: FileNode): MenuProps['items'] => [
    {
      key: 'open',
      label: 'Open',
      icon: <FileOutlined />,
      disabled: node.type !== 'file',
    },
    {
      type: 'divider',
    },
    {
      key: 'rename',
      label: 'Rename',
      icon: <EditOutlined />,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(node),
    },
  ]

  const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
    const node = info.node as DataNode & { key: string; isLeaf?: boolean }

    console.log('[FileTree] onSelect called:', { key: node.key, isLeaf: node.isLeaf, title: node.title })

    if (node.key === 'empty') return

    // If it's a folder, navigate to it
    if (!node.isLeaf) {
      console.log('[FileTree] Navigating to folder:', node.key)
      setCurrentPath(node.key)
      setExpandedKeys([...expandedKeys, node.key])
    } else {
      // If it's a file, open in editor
      console.log('[FileTree] Dispatching file:open event for:', node.key)
      const event = new CustomEvent('file:open', {
        detail: { path: node.key, name: node.title as string }
      })
      window.dispatchEvent(event)
      console.log('[FileTree] Event dispatched')
    }
  }

  const handleQuickAccess = (value: string) => {
    if (value === 'AGENT_SELECTOR') {
      // Open the agent selector modal instead of navigating
      setIsAgentSelectorOpen(true)
    } else if (value === 'SKILL_SELECTOR') {
      // Open the skill selector modal instead of navigating
      setIsSkillSelectorOpen(true)
    } else {
      setCurrentPath(value)
      setExpandedKeys([])
    }
  }

  const handleGoUp = () => {
    // Navigate to parent directory
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/'
    setCurrentPath(parentPath)
    setExpandedKeys([])
  }

  const handleAgentSelectorPath = (path: string) => {
    setCurrentPath(path)
    setExpandedKeys([])
  }

  const handleSkillSelectorPath = (path: string) => {
    setCurrentPath(path)
    setExpandedKeys([])
  }

  return (
    <div className="h-full flex flex-col">
      {/* Quick Access */}
      <div className="p-2 border-b">
        <Segmented
          block
          size="small"
          value={
            currentPath.includes('/agents') ? 'AGENT_SELECTOR' :
            currentPath.includes('/skills') ? 'SKILL_SELECTOR' :
            currentPath
          }
          onChange={(value) => handleQuickAccess(value as string)}
          options={QUICK_ACCESS}
          onClick={(e) => {
            // Check if clicking on the Agents or Skills option
            const target = e.target as HTMLElement
            const segmentItem = target.closest('.ant-segmented-item')
            if (segmentItem) {
              const itemValue = segmentItem.getAttribute('data-value') ||
                               segmentItem.getAttribute('value')
              if (itemValue === 'AGENT_SELECTOR' ||
                  (target.textContent && target.textContent.includes('Agents'))) {
                // Always open modal when clicking Agents, even if already selected
                e.preventDefault()
                setIsAgentSelectorOpen(true)
              } else if (itemValue === 'SKILL_SELECTOR' ||
                  (target.textContent && target.textContent.includes('Skills'))) {
                // Always open modal when clicking Skills, even if already selected
                e.preventDefault()
                setIsSkillSelectorOpen(true)
              }
            }
          }}
        />
      </div>

      {/* Path Breadcrumb */}
      <div className="px-2 py-1 border-b">
        <PathBreadcrumb
          currentPath={currentPath}
          onNavigate={(path) => {
            setCurrentPath(path)
            loadFiles(path)
          }}
        />
      </div>

      {/* Action Buttons */}
      <Space className="p-2 border-b" size="small" wrap>
        {(currentPath === '/home/master/projects/agents' ||
          currentPath.includes('/.claude/agents')) ? (
          <Button
            size="small"
            type="primary"
            icon={<RocketOutlined />}
            onClick={() => setIsCreateAgentModalOpen(true)}
            title="Create New Agent"
          >
            Agent
          </Button>
        ) : (currentPath === '/home/master/projects/skills' ||
          currentPath.includes('/.claude/skills')) ? (
          <Button
            size="small"
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => setIsCreateSkillModalOpen(true)}
            title="Create New Skill"
          >
            Skill
          </Button>
        ) : (
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setNewItemType('file')
              setIsCreateModalOpen(true)
            }}
            title="New File"
          >
            File
          </Button>
        )}
        <Button
          size="small"
          icon={<FolderOutlined />}
          onClick={() => {
            setNewItemType('folder')
            setIsCreateModalOpen(true)
          }}
          title={currentPath === '/home/master/projects' ? 'New Project (creates .claude structure)' : 'New Folder'}
        >
          {currentPath === '/home/master/projects' ? 'Project' : 'Folder'}
        </Button>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => loadFiles(currentPath)}
          loading={loading}
          title="Refresh"
        />
      </Space>

      {/* File Tree */}
      <div
        className="flex-1 overflow-auto p-2"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragOver ? '2px dashed #1890ff' : '2px dashed transparent',
          backgroundColor: isDragOver ? '#e6f7ff' : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 z-10 pointer-events-none">
            <div className="text-blue-600 text-lg font-semibold">
              Drop files here to upload to {currentPath}
            </div>
          </div>
        )}
        {treeData.length > 0 ? (
          <Tree
            showIcon
            treeData={treeData}
            onSelect={onSelect}
            expandedKeys={expandedKeys}
            onExpand={(keys) => setExpandedKeys(keys as string[])}
            switcherIcon={<FolderOpenOutlined />}
          />
        ) : (
          <div className="text-center text-gray-400 mt-8">
            {loading ? 'Loading...' : 'Empty directory'}
          </div>
        )}
      </div>

      <Modal
        title={`Create New ${newItemType === 'file' ? 'File' : (currentPath === '/home/master/projects' ? 'Project' : 'Folder')}`}
        open={isCreateModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setIsCreateModalOpen(false)
          setNewItemName('')
        }}
        okText="Create"
      >
        <div className="space-y-2">
          <Input
            placeholder={`Enter ${newItemType === 'file' ? 'file' : (currentPath === '/home/master/projects' ? 'project' : 'folder')} name${newItemType === 'file' ? ' (e.g., script.py, index.html)' : ''}`}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onPressEnter={handleCreate}
            autoFocus
          />
          <p className="text-sm text-gray-500">
            Creating in: <span className="font-mono">{currentPath}</span>
          </p>
          {currentPath === '/home/master/projects' && newItemType === 'folder' && (
            <p className="text-sm text-blue-600">
              ℹ️ Will automatically create .claude/agents and .claude/skills directories
            </p>
          )}
        </div>
      </Modal>

      {/* Agent Deploy Modal */}
      <AgentDeployModal
        open={isDeployModalOpen}
        agentFileName={deployAgentFile}
        onClose={() => {
          setIsDeployModalOpen(false)
          setDeployAgentFile('')
        }}
        onSuccess={() => {
          message.success('Agent deployed successfully!')
        }}
      />

      {/* Create Agent Modal */}
      <CreateAgentModal
        open={isCreateAgentModalOpen}
        onClose={() => setIsCreateAgentModalOpen(false)}
        onPasteSaved={() => {
          // Paste mode saved directly - just refresh file list
          loadFiles(currentPath)
        }}
        onSuccess={(fileName, content, skipAIGeneration) => {
          // AI or Import mode - open editor
          setEditorFileName(fileName)
          setEditorInitialContent(content)
          setEditorSkipAI(skipAIGeneration)

          // Extract name and description from content
          const lines = content.split('\n')
          const name = lines[0]?.replace(/^#\s*/, '') || 'New Agent'
          const description = lines.slice(1).join('\n').trim() || 'Agent description'

          setEditorAgentName(name)
          setEditorAgentDescription(description)

          setIsCreateAgentModalOpen(false)
          setIsAgentEditorModalOpen(true)
        }}
      />

      {/* Agent Editor Modal */}
      <AgentEditorModal
        open={isAgentEditorModalOpen}
        fileName={editorFileName}
        initialContent={editorInitialContent}
        agentName={editorAgentName}
        agentDescription={editorAgentDescription}
        skipAIGeneration={editorSkipAI}
        onClose={() => {
          setIsAgentEditorModalOpen(false)
          setEditorFileName('')
          setEditorInitialContent('')
          setEditorAgentName('')
          setEditorAgentDescription('')
          setEditorSkipAI(false)
        }}
        onSaveSuccess={() => {
          loadFiles(currentPath)
        }}
      />

      {/* Agent Selector Modal */}
      <AgentSelectorModal
        open={isAgentSelectorOpen}
        onClose={() => setIsAgentSelectorOpen(false)}
        onSelectPath={handleAgentSelectorPath}
      />

      {/* Skill Deploy Modal */}
      <SkillDeployModal
        open={isSkillDeployModalOpen}
        skillFileName={deploySkillFile}
        onClose={() => {
          setIsSkillDeployModalOpen(false)
          setDeploySkillFile('')
        }}
        onSuccess={() => {
          message.success('Skill deployed successfully!')
        }}
      />

      {/* Create Skill Modal */}
      <CreateSkillModal
        open={isCreateSkillModalOpen}
        onClose={() => setIsCreateSkillModalOpen(false)}
        onPasteSaved={() => {
          // Paste mode saved directly - just refresh file list
          loadFiles(currentPath)
        }}
        onSuccess={(fileName, content, skipAIGeneration) => {
          // AI or Import mode - open editor
          setEditorSkillFileName(fileName)
          setEditorSkillInitialContent(content)
          setEditorSkillSkipAI(skipAIGeneration)

          // Extract name and description from content
          const lines = content.split('\n')
          const name = lines[0]?.replace(/^#\s*/, '') || 'New Skill'
          const description = lines.slice(1).join('\n').trim() || 'Skill description'

          setEditorSkillName(name)
          setEditorSkillDescription(description)

          setIsCreateSkillModalOpen(false)
          setIsSkillEditorModalOpen(true)
        }}
      />

      {/* Skill Editor Modal */}
      <SkillEditorModal
        open={isSkillEditorModalOpen}
        fileName={editorSkillFileName}
        initialContent={editorSkillInitialContent}
        skillName={editorSkillName}
        skillDescription={editorSkillDescription}
        skipAIGeneration={editorSkillSkipAI}
        onClose={() => {
          setIsSkillEditorModalOpen(false)
          setEditorSkillFileName('')
          setEditorSkillInitialContent('')
          setEditorSkillName('')
          setEditorSkillDescription('')
          setEditorSkillSkipAI(false)
        }}
        onSaveSuccess={(data) => {
          loadFiles(currentPath)
          // If skill data is provided, open resource modal
          if (data?.name && data?.skillPath && data?.resourcesPath) {
            setResourceSkillName(data.name)
            setResourceSkillPath(data.skillPath)
            setResourcesPath(data.resourcesPath)
            setIsSkillResourceModalOpen(true)
          }
        }}
      />

      {/* Skill Selector Modal */}
      <SkillSelectorModal
        open={isSkillSelectorOpen}
        onClose={() => setIsSkillSelectorOpen(false)}
        onSelectPath={handleSkillSelectorPath}
        onCreateNew={() => {
          setIsSkillSelectorOpen(false)
          setIsCreateSkillModalOpen(true)
        }}
      />

      {/* Skill Resource Modal */}
      <SkillResourceModal
        open={isSkillResourceModalOpen}
        onClose={() => setIsSkillResourceModalOpen(false)}
        skillName={resourceSkillName}
        resourcesPath={resourcesPath}
        skillPath={resourceSkillPath}
      />
    </div>
  )
}

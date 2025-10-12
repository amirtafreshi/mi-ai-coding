'use client'

import { useState, useEffect } from 'react'
import { Modal, List, Button, message, Spin } from 'antd'
import { RocketOutlined, FolderOutlined, FolderOpenOutlined } from '@ant-design/icons'

interface AgentSelectorModalProps {
  open: boolean
  onClose: () => void
  onSelectPath: (path: string) => void
}

interface Project {
  name: string
  path: string
  agentPath: string
}

export function AgentSelectorModal({ open, onClose, onSelectPath }: AgentSelectorModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [masterAgentsPath, setMasterAgentsPath] = useState('')

  useEffect(() => {
    if (open) {
      loadProjects()
    }
  }, [open])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/projects/list')
      if (!response.ok) {
        throw new Error('Failed to load projects')
      }

      const data = await response.json()
      setProjects(data.projects)
      setMasterAgentsPath(data.masterAgentsPath)
    } catch (error) {
      console.error('Error loading projects:', error)
      message.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMasterAgents = () => {
    onSelectPath(masterAgentsPath)
    onClose()
  }

  const handleSelectProjectAgents = (project: Project) => {
    onSelectPath(project.agentPath)
    onClose()
  }

  return (
    <Modal
      title="Select Agent Folder"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>
      ]}
      width={600}
    >
      {loading ? (
        <div className="text-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Master Agent Templates */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Master Agent Templates</h3>
            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={handleSelectMasterAgents}
              block
              size="large"
            >
              Master Templates ({masterAgentsPath})
            </Button>
          </div>

          {/* Project-Specific Agents */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Project-Specific Agents</h3>
            {projects.length > 0 ? (
              <List
                dataSource={projects}
                renderItem={(project) => (
                  <List.Item>
                    <Button
                      icon={<FolderOpenOutlined />}
                      onClick={() => handleSelectProjectAgents(project)}
                      block
                      className="text-left"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-xs text-gray-500">{project.agentPath}</span>
                      </div>
                    </Button>
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center py-4 text-gray-400">
                No projects found with .claude/agents folders
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

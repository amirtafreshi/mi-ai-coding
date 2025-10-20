'use client'

import { useState, useEffect } from 'react'
import { Modal, List, Button, message, Spin } from 'antd'
import { ThunderboltOutlined, FolderOutlined, FolderOpenOutlined } from '@ant-design/icons'

interface SkillSelectorModalProps {
  open: boolean
  onClose: () => void
  onSelectPath: (path: string) => void
  onCreateNew?: () => void
}

interface Project {
  name: string
  path: string
  skillPath: string
}

export function SkillSelectorModal({ open, onClose, onSelectPath, onCreateNew }: SkillSelectorModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [masterSkillsPath, setMasterSkillsPath] = useState('')

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
      setMasterSkillsPath(data.masterSkillsPath)
    } catch (error) {
      console.error('Error loading projects:', error)
      message.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMasterSkills = () => {
    onSelectPath(masterSkillsPath)
    onClose()
  }

  const handleSelectProjectSkills = (project: Project) => {
    onSelectPath(project.skillPath)
    onClose()
  }

  return (
    <Modal
      title="Skills Selector"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        onCreateNew && (
          <Button key="create" type="primary" onClick={onCreateNew}>
            Create New Skill
          </Button>
        )
      ]}
      width={600}
    >
      {loading ? (
        <div className="text-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Master Skill Templates */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Master Skill Templates</h3>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleSelectMasterSkills}
              block
              size="large"
            >
              Master Templates ({masterSkillsPath})
            </Button>
          </div>

          {/* Project-Specific Skills */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Project-Specific Skills</h3>
            {projects.length > 0 ? (
              <List
                dataSource={projects}
                renderItem={(project) => (
                  <List.Item>
                    <Button
                      icon={<FolderOpenOutlined />}
                      onClick={() => handleSelectProjectSkills(project)}
                      block
                    >
                      {project.name}
                    </Button>
                  </List.Item>
                )}
                size="small"
              />
            ) : (
              <div className="text-center text-gray-400 py-4">
                No projects found
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

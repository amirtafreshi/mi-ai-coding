'use client'

import { useState, useEffect } from 'react'
import { Modal, List, Button, message, Spin, Typography } from 'antd'
import { ThunderboltOutlined, FolderOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

interface SkillDeployModalProps {
  open: boolean
  skillFileName: string  // The folder name containing SKILL.md
  onClose: () => void
  onSuccess: () => void
}

interface Project {
  name: string
  path: string
  skillPath: string
}

export function SkillDeployModal({
  open,
  skillFileName,
  onClose,
  onSuccess,
}: SkillDeployModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [skillName, setSkillName] = useState('')

  useEffect(() => {
    if (open) {
      loadProjects()
      // Extract skill name from file path
      // skillFileName should be the folder name (e.g., "document-analyzer")
      const name = skillFileName.replace(/^.*\//, '').replace(/\/$/, '')
      setSkillName(name)
    }
  }, [open, skillFileName])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/projects/list')
      if (!response.ok) {
        throw new Error('Failed to load projects')
      }

      const data = await response.json()
      setProjects(data.projects)
    } catch (error) {
      console.error('Error loading projects:', error)
      message.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async (project: Project) => {
    setDeploying(true)
    try {
      const response = await fetch('/api/skills/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillName,
          projectPath: project.path,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deploy skill')
      }

      message.success(data.message || `Skill deployed to ${project.name}!`)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error deploying skill:', error)
      message.error(error.message || 'Failed to deploy skill')
    } finally {
      setDeploying(false)
    }
  }

  return (
    <Modal
      title={
        <span>
          <ThunderboltOutlined /> Deploy Skill
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>
      ]}
      width={600}
    >
      <div className="mb-4">
        <Paragraph>
          <Text strong>Skill:</Text> <Text code>{skillName}</Text>
        </Paragraph>
        <Paragraph type="secondary">
          Select a project to deploy this skill to. The skill will be copied to the project's
          <Text code> .claude/skills/</Text> folder.
        </Paragraph>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Spin size="large" />
        </div>
      ) : projects.length > 0 ? (
        <List
          dataSource={projects}
          renderItem={(project) => (
            <List.Item>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <FolderOutlined />
                  <span>{project.name}</span>
                  <Text type="secondary" className="text-xs">
                    {project.skillPath}
                  </Text>
                </div>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={() => handleDeploy(project)}
                  loading={deploying}
                  size="small"
                >
                  Deploy
                </Button>
              </div>
            </List.Item>
          )}
        />
      ) : (
        <div className="text-center text-gray-400 py-8">
          <p>No projects found</p>
          <p className="text-sm mt-2">Create a project folder in /home/master/projects first</p>
        </div>
      )}
    </Modal>
  )
}

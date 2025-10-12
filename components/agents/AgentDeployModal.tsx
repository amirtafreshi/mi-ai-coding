'use client'

import { useState, useEffect } from 'react'
import { Modal, Select, Alert, message, Spin } from 'antd'
import { RocketOutlined, WarningOutlined } from '@ant-design/icons'

interface Project {
  name: string
  path: string
  agentsPath: string
  hasAgentsFolder: boolean
}

interface AgentDeployModalProps {
  open: boolean
  agentFileName: string
  onClose: () => void
  onSuccess?: () => void
}

export function AgentDeployModal({
  open,
  agentFileName,
  onClose,
  onSuccess,
}: AgentDeployModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [conflictWarning, setConflictWarning] = useState(false)

  useEffect(() => {
    if (open) {
      loadProjects()
      setSelectedProject(null)
      setConflictWarning(false)
    }
  }, [open])

  const loadProjects = async () => {
    setLoadingProjects(true)
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('[AgentDeployModal] Error loading projects:', error)
      message.error('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleDeploy = async (overwrite = false) => {
    if (!selectedProject) {
      message.warning('Please select a project')
      return
    }

    const project = projects.find((p) => p.path === selectedProject)
    if (!project) {
      message.error('Project not found')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/agents/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentFileName,
          projectPath: project.path,
          overwrite,
        }),
      })

      const data = await response.json()

      if (response.status === 409 && data.exists) {
        // File already exists, show warning
        setConflictWarning(true)
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deploy agent')
      }

      message.success(
        data.overwritten
          ? `Agent ${agentFileName} updated in ${project.name}`
          : `Agent ${agentFileName} deployed to ${project.name}`
      )

      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('[AgentDeployModal] Error deploying agent:', error)
      message.error(error.message || 'Failed to deploy agent')
    } finally {
      setLoading(false)
    }
  }

  const handleOverwrite = () => {
    setConflictWarning(false)
    handleDeploy(true)
  }

  return (
    <Modal
      title={
        <span>
          <RocketOutlined /> Deploy Agent: {agentFileName}
        </span>
      }
      open={open}
      onOk={() => handleDeploy(false)}
      onCancel={onClose}
      okText={conflictWarning ? 'Overwrite' : 'Deploy'}
      okButtonProps={{
        loading,
        disabled: !selectedProject || loadingProjects,
        danger: conflictWarning,
      }}
      cancelText="Cancel"
      width={600}
    >
      {conflictWarning && (
        <Alert
          message="Agent Already Exists"
          description={`The agent ${agentFileName} already exists in the selected project. Do you want to overwrite it?`}
          type="warning"
          icon={<WarningOutlined />}
          showIcon
          closable
          onClose={() => setConflictWarning(false)}
          className="mb-4"
        />
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Project
          </label>
          {loadingProjects ? (
            <div className="text-center py-4">
              <Spin tip="Loading projects..." />
            </div>
          ) : (
            <Select
              value={selectedProject}
              onChange={(value) => {
                setSelectedProject(value)
                setConflictWarning(false)
              }}
              placeholder="Choose a project to deploy to"
              style={{ width: '100%' }}
              size="large"
              options={projects.map((project) => ({
                label: (
                  <div>
                    <div className="font-semibold">{project.name}</div>
                    <div className="text-xs text-gray-500">{project.path}</div>
                    {!project.hasAgentsFolder && (
                      <div className="text-xs text-orange-500">
                        .claude/agents/ folder will be created
                      </div>
                    )}
                  </div>
                ),
                value: project.path,
              }))}
            />
          )}
        </div>

        {selectedProject && (
          <Alert
            message="Deployment Target"
            description={
              <div className="text-sm">
                <div>
                  <strong>Agent:</strong> {agentFileName}
                </div>
                <div>
                  <strong>Destination:</strong>{' '}
                  {
                    projects.find((p) => p.path === selectedProject)
                      ?.agentsPath
                  }
                </div>
              </div>
            }
            type="info"
            showIcon
          />
        )}
      </div>

      {conflictWarning && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleOverwrite}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Yes, Overwrite
          </button>
          <button
            onClick={() => setConflictWarning(false)}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </Modal>
  )
}

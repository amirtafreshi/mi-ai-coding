'use client'

import { useState, useEffect } from 'react'
import { Modal, Upload, Button, List, message, Input, Popconfirm, Space, Empty } from 'antd'
import { UploadOutlined, DeleteOutlined, FolderAddOutlined, FileOutlined, FolderOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'

interface SkillResourceModalProps {
  open: boolean
  onClose: () => void
  skillName: string
  resourcesPath: string
  skillPath: string
}

interface ResourceFile {
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
}

export function SkillResourceModal({
  open,
  onClose,
  skillName,
  resourcesPath,
  skillPath,
}: SkillResourceModalProps) {
  const [loading, setLoading] = useState(false)
  const [resources, setResources] = useState<ResourceFile[]>([])
  const [uploadList, setUploadList] = useState<UploadFile[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)

  // Load existing resources
  const loadResources = async () => {
    try {
      const response = await fetch(`/api/filesystem/browse?path=${encodeURIComponent(resourcesPath)}`, {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load resources')
      }

      // Map entries to resources format
      const resourceItems = (data.entries || []).map((entry: any) => ({
        name: entry.name,
        path: entry.path,
        type: entry.isDirectory ? 'folder' : 'file',
        size: entry.size,
      }))

      setResources(resourceItems)
    } catch (error: any) {
      console.error('[SkillResourceModal] Load error:', error)
      message.error('Failed to load resources')
    }
  }

  useEffect(() => {
    if (open) {
      loadResources()
    }
  }, [open, resourcesPath])

  const handleUpload = async () => {
    if (uploadList.length === 0) {
      message.warning('Please select files to upload')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()

      uploadList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('files', file.originFileObj)
        }
      })

      formData.append('targetPath', resourcesPath)

      const response = await fetch('/api/filesystem/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload files')
      }

      message.success(`Uploaded ${uploadList.length} file(s) successfully!`)
      setUploadList([])
      loadResources()
    } catch (error: any) {
      console.error('[SkillResourceModal] Upload error:', error)
      message.error(error.message || 'Failed to upload files')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (resourcePath: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/filesystem/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: resourcePath }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete resource')
      }

      message.success('Resource deleted successfully!')
      loadResources()
    } catch (error: any) {
      console.error('[SkillResourceModal] Delete error:', error)
      message.error(error.message || 'Failed to delete resource')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      message.error('Please enter a folder name')
      return
    }

    setLoading(true)
    try {
      const folderPath = `${resourcesPath}/${newFolderName.trim()}`

      const response = await fetch('/api/filesystem/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: folderPath }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create folder')
      }

      message.success('Folder created successfully!')
      setNewFolderName('')
      setShowNewFolder(false)
      loadResources()
    } catch (error: any) {
      console.error('[SkillResourceModal] Create folder error:', error)
      message.error(error.message || 'Failed to create folder')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={`Manage Resources - ${skillName}`}
      open={open}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Upload Section */}
        <div>
          <h4>Upload Files</h4>
          <Upload
            multiple
            fileList={uploadList}
            onChange={({ fileList }) => setUploadList(fileList)}
            beforeUpload={() => false}
            onRemove={(file) => {
              setUploadList(uploadList.filter(f => f.uid !== file.uid))
            }}
          >
            <Button icon={<UploadOutlined />}>Select Files</Button>
          </Upload>
          {uploadList.length > 0 && (
            <Button
              type="primary"
              loading={loading}
              onClick={handleUpload}
              style={{ marginTop: 8 }}
            >
              Upload {uploadList.length} file(s)
            </Button>
          )}
        </div>

        {/* Create Folder Section */}
        <div>
          {!showNewFolder ? (
            <Button
              icon={<FolderAddOutlined />}
              onClick={() => setShowNewFolder(true)}
            >
              Create Subfolder
            </Button>
          ) : (
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onPressEnter={handleCreateFolder}
              />
              <Button
                type="primary"
                loading={loading}
                onClick={handleCreateFolder}
              >
                Create
              </Button>
              <Button onClick={() => {
                setShowNewFolder(false)
                setNewFolderName('')
              }}>
                Cancel
              </Button>
            </Space.Compact>
          )}
        </div>

        {/* Resources List */}
        <div>
          <h4>Current Resources</h4>
          {resources.length === 0 ? (
            <Empty
              description="No resources yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              size="small"
              bordered
              dataSource={resources}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="Delete this resource?"
                      onConfirm={() => handleDelete(item.path)}
                      okText="Delete"
                      cancelText="Cancel"
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        loading={loading}
                      />
                    </Popconfirm>,
                  ]}
                >
                  <Space>
                    {item.type === 'folder' ? (
                      <FolderOutlined style={{ color: '#1890ff' }} />
                    ) : (
                      <FileOutlined />
                    )}
                    <span>{item.name}</span>
                    {item.size && (
                      <span style={{ color: '#999', fontSize: '12px' }}>
                        ({(item.size / 1024).toFixed(2)} KB)
                      </span>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          )}
        </div>
      </Space>
    </Modal>
  )
}

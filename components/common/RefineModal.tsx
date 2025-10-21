'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Input, Button, Progress, Alert, message, Tabs } from 'antd'
import { ThunderboltOutlined, CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons'
import { useDocumentRefine, DocumentType } from './useDocumentRefine'
import { DiffEditor } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

const { TextArea } = Input

interface RefineModalProps {
  open: boolean
  fileName: string
  filePath: string
  fileType: DocumentType
  currentContent: string
  onClose: () => void
  onSuccess: (refinedContent: string) => void
}

export function RefineModal({
  open,
  fileName,
  filePath,
  fileType,
  currentContent,
  onClose,
  onSuccess,
}: RefineModalProps) {
  const [instructions, setInstructions] = useState('')
  const [showDiff, setShowDiff] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [hasManualEdits, setHasManualEdits] = useState(false)
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null)

  const { refinedContent, status, progress, error, refine, isRefining } = useDocumentRefine({
    onComplete: (content) => {
      // Don't close immediately - show the diff view first
      setEditedContent(content)
      setHasManualEdits(false)
      setShowDiff(true)
    },
    onError: (error) => {
      message.error(`Refinement failed: ${error}`)
    },
  })

  // Clear state when modal closes
  useEffect(() => {
    if (!open) {
      setInstructions('')
      setShowDiff(false)
      setEditedContent('')
      setHasManualEdits(false)
    }
  }, [open])

  const handleRefine = () => {
    if (!instructions.trim()) {
      message.warning('Please enter refinement instructions')
      return
    }

    if (!currentContent) {
      message.error('No content to refine')
      return
    }

    refine(currentContent, instructions.trim(), fileType, fileName)
  }

  const handleRefineAgain = () => {
    if (!instructions.trim()) {
      message.warning('Please enter refinement instructions')
      return
    }

    // Use the edited content as the base for the next refinement
    const baseContent = hasManualEdits ? editedContent : refinedContent
    refine(baseContent, instructions.trim(), fileType, fileName)
  }

  const handleAccept = () => {
    const finalContent = hasManualEdits ? editedContent : refinedContent
    message.success('Changes accepted!')
    onSuccess(finalContent)
    onClose()
    setInstructions('')
    setShowDiff(false)
    setEditedContent('')
    setHasManualEdits(false)
  }

  const handleReject = () => {
    message.info('Changes rejected')
    setShowDiff(false)
    setEditedContent('')
    setHasManualEdits(false)
  }

  const handleDiffEditorMount = (editor: editor.IStandaloneDiffEditor) => {
    diffEditorRef.current = editor
    const modifiedEditor = editor.getModifiedEditor()

    // Listen for content changes in the modified editor
    modifiedEditor.onDidChangeModelContent(() => {
      const newContent = modifiedEditor.getValue()
      if (newContent !== refinedContent) {
        setEditedContent(newContent)
        setHasManualEdits(true)
      }
    })
  }

  const fileTypeLabels: Record<DocumentType, string> = {
    agent: 'Agent',
    skill: 'Skill',
    file: 'File',
  }

  // Get language from file extension
  const getLanguage = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase()
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
    }
    return languageMap[extension || ''] || 'plaintext'
  }

  const displayContent = hasManualEdits ? editedContent : refinedContent

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <ThunderboltOutlined />
          <span>
            {showDiff ? `Review Changes - ${fileName}` : `Refine ${fileTypeLabels[fileType]}`}
          </span>
          {hasManualEdits && showDiff && (
            <span className="text-orange-500 text-sm ml-2">
              <EditOutlined /> (Manually Edited)
            </span>
          )}
        </div>
      }
      open={open}
      onCancel={() => {
        if (showDiff) {
          handleReject()
        } else {
          onClose()
        }
      }}
      width={showDiff ? 1200 : 700}
      footer={
        showDiff
          ? [
              <Button key="reject" icon={<CloseOutlined />} onClick={handleReject}>
                Reject Changes
              </Button>,
              <Button
                key="refine-again"
                icon={<ThunderboltOutlined />}
                onClick={handleRefineAgain}
                loading={isRefining}
                disabled={isRefining}
              >
                Refine Again
              </Button>,
              <Button
                key="accept"
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleAccept}
              >
                Accept Changes{hasManualEdits ? ' (With Edits)' : ''}
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onClose} disabled={isRefining}>
                Cancel
              </Button>,
              <Button
                key="refine"
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleRefine}
                loading={isRefining}
                disabled={!instructions.trim() || isRefining}
              >
                Refine with AI
              </Button>,
            ]
      }
      maskClosable={!isRefining && !showDiff}
      closable={!isRefining}
    >
      {showDiff ? (
        // Diff View
        <div className="space-y-4">
          <Alert
            message={
              <div>
                Review the changes below. You can <strong>manually edit</strong> the refined
                version in the right panel, click <strong>Refine Again</strong> to apply new
                instructions, or <strong>Accept</strong>/<strong>Reject</strong> the changes.
              </div>
            }
            type="info"
            showIcon
          />

          {hasManualEdits && (
            <Alert
              message="Manual edits detected"
              description="You've made manual changes to the refined content. These will be preserved if you click 'Accept Changes' or used as the base if you click 'Refine Again'."
              type="warning"
              showIcon
            />
          )}

          <Tabs
            defaultActiveKey="diff"
            items={[
              {
                key: 'diff',
                label: 'Editable Side-by-Side Comparison',
                children: (
                  <div style={{ height: '500px', border: '1px solid #d9d9d9' }}>
                    <DiffEditor
                      height="500px"
                      original={currentContent}
                      modified={displayContent}
                      language={getLanguage(fileName)}
                      theme="vs-dark"
                      onMount={handleDiffEditorMount}
                      options={{
                        readOnly: false, // Enable editing
                        renderSideBySide: true,
                        minimap: { enabled: false },
                        fontSize: 13,
                        originalEditable: false, // Original (left) is read-only
                        automaticLayout: true,
                      }}
                    />
                  </div>
                ),
              },
              {
                key: 'refined',
                label: 'Refined Version (Full)',
                children: (
                  <div
                    style={{
                      height: '500px',
                      overflow: 'auto',
                      border: '1px solid #d9d9d9',
                      padding: '12px',
                      backgroundColor: '#1e1e1e',
                      color: '#d4d4d4',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {displayContent}
                  </div>
                ),
              },
            ]}
          />

          <div className="text-sm text-gray-500">
            <strong>Changes Summary:</strong>
            <ul className="list-disc list-inside mt-2">
              <li>Original: {currentContent.length} characters</li>
              <li>
                {hasManualEdits ? 'Edited' : 'Refined'}: {displayContent.length} characters
              </li>
              <li>
                Difference: {displayContent.length > currentContent.length ? '+' : ''}
                {displayContent.length - currentContent.length} characters
              </li>
            </ul>
          </div>
        </div>
      ) : (
        // Refine Input View
        <div className="space-y-4">
          {/* File Info */}
          <Alert
            message={
              <div>
                <strong>File:</strong> {fileName}
                <br />
                <strong>Type:</strong> {fileTypeLabels[fileType]}
                <br />
                <strong>Size:</strong> {currentContent.length} characters
              </div>
            }
            type="info"
            showIcon
          />

          {/* Instructions Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Refinement Instructions <span className="text-red-500">*</span>
            </label>
            <TextArea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g., 'Add more examples', 'Improve documentation', 'Fix formatting issues', 'Add error handling'"
              rows={4}
              disabled={isRefining}
              maxLength={5000}
              showCount
            />
            <div className="mt-2 text-xs text-gray-500">
              <strong>Suggestion examples:</strong>
              <ul className="list-disc list-inside mt-1">
                <li>Add more detailed examples and use cases</li>
                <li>Improve documentation clarity and structure</li>
                <li>Fix any formatting or style issues</li>
                <li>Enhance error handling and edge cases</li>
                <li>Add helpful comments and explanations</li>
              </ul>
            </div>
          </div>

          {/* Progress */}
          {isRefining && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Refining document...</span>
                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
              </div>
              <Progress percent={progress} status="active" showInfo={false} />
              <div className="mt-2 text-xs text-gray-500">
                The AI is analyzing your document and applying your instructions. This may take a
                moment.
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert
              message="Refinement Error"
              description={error}
              type="error"
              showIcon
              closable
            />
          )}
        </div>
      )}
    </Modal>
  )
}

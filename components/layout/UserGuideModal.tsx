'use client'

import { Modal, Tabs, Typography, Divider, Space, Tag } from 'antd'
import {
  DesktopOutlined,
  FolderOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  EyeOutlined,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

interface UserGuideModalProps {
  open: boolean
  onClose: () => void
}

export function UserGuideModal({ open, onClose }: UserGuideModalProps) {
  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      icon: <ThunderboltOutlined />,
      children: (
        <div>
          <Title level={4}>Welcome to MI AI Coding Platform</Title>
          <Paragraph>
            This is a production-ready AI Coding Platform with dual VNC displays for visual debugging,
            file management, code editing, and real-time agent activity logging.
          </Paragraph>

          <Divider />

          <Title level={5}>Key Features</Title>
          <Space direction="vertical" size="small">
            <Text><Tag color="blue">Dual VNC Displays</Tag> Terminal (left) and Playwright testing (right)</Text>
            <Text><Tag color="green">File Explorer</Tag> Create, edit, delete files and folders</Text>
            <Text><Tag color="purple">Code Editor</Tag> Monaco editor with syntax highlighting</Text>
            <Text><Tag color="orange">Activity Stream</Tag> Real-time agent logs via WebSocket</Text>
            <Text><Tag color="red">Multi-Agent System</Tag> 7 coordinated AI agents</Text>
          </Space>
        </div>
      ),
    },
    {
      key: 'vnc',
      label: 'VNC Displays',
      icon: <DesktopOutlined />,
      children: (
        <div>
          <Title level={4}>
            <DesktopOutlined /> Using VNC Displays
          </Title>

          <Divider orientation="left">Left Display (Terminal VNC - :98)</Divider>
          <Paragraph>
            <strong>Purpose:</strong> Terminal access for running commands, Claude Code, and general development.
          </Paragraph>

          <Title level={5}>Opening a Terminal:</Title>
          <ol>
            <li>Right-click anywhere on the left VNC desktop</li>
            <li>Select <Tag color="blue">Terminal</Tag> from the menu</li>
            <li>Terminal opens in <code>/home/master/projects</code> as master user</li>
          </ol>

          <Title level={5}>Starting Claude Code:</Title>
          <Paragraph>
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
{`# In the terminal:
cd mi-ai-coding
claude`}
            </pre>
          </Paragraph>

          <Divider orientation="left">Right Display (Playwright VNC - :99)</Divider>
          <Paragraph>
            <strong>Purpose:</strong> Visual browser automation for frontend testing agents.
          </Paragraph>

          <Paragraph>
            <Tag color="orange">IMPORTANT</Tag> All Playwright/Puppeteer tests <strong>must</strong> run on <code>DISPLAY=:99</code>
          </Paragraph>

          <Paragraph>
            This display automatically shows browser automation when the frontend-testing agent runs E2E tests.
            You can watch tests execute in real-time on this display.
          </Paragraph>

          <Title level={5}>Running Tests (visible on right VNC):</Title>
          <Paragraph>
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
{`# Always use DISPLAY=:99 for browser tests
DISPLAY=:99 npx playwright test
DISPLAY=:99 npx playwright test --ui
npm test  # Pre-configured with DISPLAY=:99`}
            </pre>
          </Paragraph>

          <Title level={5}>Opening a Browser on VNC:</Title>
          <ol>
            <li>Right-click on either VNC desktop</li>
            <li>Select <Tag color="green">Browser</Tag> from the menu</li>
            <li>Chromium launches on that display</li>
          </ol>
        </div>
      ),
    },
    {
      key: 'file-explorer',
      label: 'File Explorer',
      icon: <FolderOutlined />,
      children: (
        <div>
          <Title level={4}>
            <FolderOutlined /> File Explorer Guide
          </Title>

          <Paragraph>
            The file explorer allows you to browse, create, edit, and delete files and folders in your project.
          </Paragraph>

          <Divider orientation="left">Toolbar Buttons</Divider>

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Tag color="blue">📄 New File</Tag>
              <Paragraph>Creates a new file in the current directory. Enter filename and content.</Paragraph>
            </div>

            <div>
              <Tag color="green">📁 New Folder</Tag>
              <Paragraph>Creates a new folder in the current directory. Enter folder name.</Paragraph>
            </div>

            <div>
              <Tag color="orange">🔄 Refresh</Tag>
              <Paragraph>Reloads the file tree to show latest changes from disk.</Paragraph>
            </div>

            <div>
              <Tag color="purple">📤 Upload</Tag>
              <Paragraph>Upload files from your local computer to the server.</Paragraph>
            </div>
          </Space>

          <Divider orientation="left">File Operations</Divider>

          <Space direction="vertical" size="small">
            <Text><strong>View File:</strong> Click on any file to open it in the code editor</Text>
            <Text><strong>Edit File:</strong> Make changes in the editor, then click Save</Text>
            <Text><strong>Delete:</strong> Right-click file/folder and select Delete</Text>
            <Text><strong>Rename:</strong> Right-click and select Rename (if available)</Text>
          </Space>

          <Divider orientation="left">Supported File Types</Divider>

          <Paragraph>
            The editor supports syntax highlighting for:
            <Tag>JavaScript</Tag>
            <Tag>TypeScript</Tag>
            <Tag>Python</Tag>
            <Tag>JSON</Tag>
            <Tag>Markdown</Tag>
            <Tag>CSS</Tag>
            <Tag>HTML</Tag>
            and more...
          </Paragraph>
        </div>
      ),
    },
    {
      key: 'code-editor',
      label: 'Code Editor',
      icon: <CodeOutlined />,
      children: (
        <div>
          <Title level={4}>
            <CodeOutlined /> Code Editor Features
          </Title>

          <Paragraph>
            The platform uses <strong>Monaco Editor</strong> (VS Code's editor) with full IntelliSense support.
          </Paragraph>

          <Divider orientation="left">Editor Features</Divider>

          <Space direction="vertical" size="small">
            <Text>✅ Syntax highlighting for 100+ languages</Text>
            <Text>✅ Code completion and IntelliSense</Text>
            <Text>✅ Multi-cursor editing</Text>
            <Text>✅ Find and replace</Text>
            <Text>✅ Code folding</Text>
            <Text>✅ Minimap</Text>
            <Text>✅ Dark/Light themes</Text>
          </Space>

          <Divider orientation="left">Keyboard Shortcuts</Divider>

          <Space direction="vertical" size="small">
            <Text><code>Ctrl+S</code> - Save file</Text>
            <Text><code>Ctrl+F</code> - Find</Text>
            <Text><code>Ctrl+H</code> - Find and replace</Text>
            <Text><code>Ctrl+/</code> - Toggle comment</Text>
            <Text><code>Alt+Up/Down</code> - Move line up/down</Text>
            <Text><code>Ctrl+D</code> - Select next occurrence</Text>
            <Text><code>F11</code> - Toggle fullscreen</Text>
          </Space>

          <Divider orientation="left">Saving Files</Divider>

          <Paragraph>
            Files are automatically saved to the database. Click the <Tag color="blue">Save</Tag> button
            or press <code>Ctrl+S</code> to save changes.
          </Paragraph>
        </div>
      ),
    },
    {
      key: 'agents',
      label: 'AI Agents',
      icon: <RobotOutlined />,
      children: (
        <div>
          <Title level={4}>
            <RobotOutlined /> Multi-Agent System
          </Title>

          <Paragraph>
            The platform uses 7 specialized AI agents that work together to build features, test code,
            fix bugs, and manage the project.
          </Paragraph>

          <Divider orientation="left">Available Agents</Divider>

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Tag color="blue">orchestrating</Tag>
              <Paragraph>Coordinates all agents, assigns tasks, and tracks progress</Paragraph>
            </div>

            <div>
              <Tag color="green">full-stack-developer</Tag>
              <Paragraph>Implements features end-to-end (frontend + backend + database)</Paragraph>
            </div>

            <div>
              <Tag color="purple">frontend-testing</Tag>
              <Paragraph>
                Runs E2E tests with Playwright on <code>DISPLAY=:99</code> (visible on right VNC)
              </Paragraph>
            </div>

            <div>
              <Tag color="red">debugging</Tag>
              <Paragraph>Investigates errors, analyzes stack traces, provides fixes</Paragraph>
            </div>

            <div>
              <Tag color="orange">documentation</Tag>
              <Paragraph>Maintains docs, PROGRESS.md, and API references</Paragraph>
            </div>

            <div>
              <Tag color="cyan">github-manager</Tag>
              <Paragraph>Creates commits, pull requests, manages releases</Paragraph>
            </div>

            <div>
              <Tag color="magenta">ubuntu-system-admin</Tag>
              <Paragraph>Manages server config, Nginx, SSL, firewall, security</Paragraph>
            </div>
          </Space>

          <Divider orientation="left">Activity Logging</Divider>

          <Paragraph>
            All agent actions are logged to the <strong>Activity Stream</strong> panel via WebSocket.
            You can see real-time updates as agents work on tasks.
          </Paragraph>
        </div>
      ),
    },
    {
      key: 'workflow',
      label: 'Typical Workflow',
      icon: <EyeOutlined />,
      children: (
        <div>
          <Title level={4}>
            <EyeOutlined /> Typical Development Workflow
          </Title>

          <Divider orientation="left">Step 1: Start Claude Code</Divider>
          <ol>
            <li>Open left VNC (Terminal VNC)</li>
            <li>Right-click → <Tag>Terminal</Tag></li>
            <li>Run: <code>cd mi-ai-coding && claude</code></li>
          </ol>

          <Divider orientation="left">Step 2: Request Features</Divider>
          <Paragraph>
            Ask Claude to implement features, fix bugs, or refactor code.
            The orchestrating agent will coordinate other agents as needed.
          </Paragraph>

          <Divider orientation="left">Step 3: Watch Agents Work</Divider>
          <Space direction="vertical" size="small">
            <Text>• <strong>Activity Stream</strong> shows real-time agent logs</Text>
            <Text>• <strong>File Explorer</strong> updates as files are created/modified</Text>
            <Text>• <strong>Right VNC</strong> shows browser tests executing live</Text>
          </Space>

          <Divider orientation="left">Step 4: Review Changes</Divider>
          <Paragraph>
            Use the file explorer and code editor to review changes made by agents.
            Open files to see modifications, test in browser.
          </Paragraph>

          <Divider orientation="left">Step 5: Run Tests</Divider>
          <Paragraph>
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
{`# In terminal on left VNC:
npm test           # Run all tests
npm run test:ui    # Interactive UI mode
npm run build      # Build for production`}
            </pre>
          </Paragraph>

          <Paragraph>
            Watch tests execute on the right VNC display in real-time.
          </Paragraph>

          <Divider orientation="left">Step 6: Deploy</Divider>
          <Paragraph>
            When ready, use the github-manager agent to create commits and pull requests,
            then deploy with PM2 or your deployment tool.
          </Paragraph>
        </div>
      ),
    },
  ]

  return (
    <Modal
      title="User Guide - MI AI Coding Platform"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
    >
      <Tabs
        defaultActiveKey="overview"
        items={tabItems}
        tabPosition="left"
        style={{ minHeight: 400 }}
      />
    </Modal>
  )
}

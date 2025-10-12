# AI-Powered Agent Creation System - Implementation Plan

**Project**: MI AI Coding Platform
**Feature**: Agent Creation with Gemini AI Integration
**Created**: 2025-10-11
**Status**: Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [API Integration Strategy](#api-integration-strategy)
4. [Component Structure](#component-structure)
5. [State Management](#state-management)
6. [UI/UX Flow](#uiux-flow)
7. [Technical Decisions](#technical-decisions)
8. [File Structure](#file-structure)
9. [Implementation Phases](#implementation-phases)
10. [Security Considerations](#security-considerations)
11. [Testing Strategy](#testing-strategy)
12. [Cost & Rate Limiting](#cost--rate-limiting)

---

## Executive Summary

### Goal
Transform the File Explorer's "+File" button into a "+Agent" button when browsing `/home/master/projects/agents/`, enabling users to create custom AI agent markdown files using three methods:
1. AI-generated via Gemini API (with iterative refinement)
2. Paste existing agent markdown
3. Import from URL

### Key Requirements
- Context-aware UI (button changes based on current path)
- Streaming AI responses for real-time feedback
- Markdown editor with live preview
- Iterative refinement capability
- Agent template structure guidance
- Secure API key management (server-side only)

### Success Criteria
- Users can generate agent markdown in <30 seconds
- AI-generated agents follow consistent template structure
- Streaming provides smooth, real-time experience
- System handles errors gracefully (rate limits, API failures)
- Generated agents are immediately deployable

---

## Architecture Overview

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ FileTree Component                                       │   │
│  │  - Detects current path                                  │   │
│  │  - Conditional button: "+File" or "+Agent"               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓ Click                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ CreateAgentModal                                         │   │
│  │  - Mode Selection: AI | Paste | Import                   │   │
│  │  - Agent Name Input                                      │   │
│  │  - Description/Prompt Input                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓ Generate                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ AgentEditorModal                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐   │   │
│  │  │ Markdown Editor │  │ Live Preview (react-markdown)│   │   │
│  │  │ (@uiw/react-md) │  │ - Syntax highlighting       │   │   │
│  │  └─────────────────┘  └─────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────────┐   │
│  │  │ Actions: [Refine with AI] [Save] [Cancel]          │   │
│  │  └─────────────────────────────────────────────────────┘   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          ↓ API Call
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js API Routes                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ POST /api/agents/generate (Server-Side)                 │   │
│  │  - Receives: agent name, description, refinement prompt │   │
│  │  - Validates input (Zod schema)                          │   │
│  │  - Reads GEMINI_API_KEY from process.env                │   │
│  │  - Constructs structured prompt with agent template     │   │
│  │  - Calls Gemini API with streaming                      │   │
│  │  - Returns: Server-Sent Events (SSE) stream             │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ POST /api/agents/import-url                              │   │
│  │  - Fetches markdown from external URL                    │   │
│  │  - Validates markdown structure                          │   │
│  │  - Returns parsed agent markdown                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Gemini API (Google)                        │
│  - Model: gemini-2.0-flash-exp (fast, cost-effective)          │
│  - Streaming: generateContentStream()                           │
│  - Context: Agent template + user description                   │
└─────────────────────────────────────────────────────────────────┘
                          ↓ Save
┌─────────────────────────────────────────────────────────────────┐
│                  File System API                                │
│  POST /api/filesystem/create-file                               │
│  - Path: /home/master/projects/agents/{name}.md                 │
│  - Content: Generated/edited markdown                           │
└─────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
FileTree (existing)
├── [Conditional Button] +Agent or +File
│
└── CreateAgentModal (new)
    ├── ModeTabs (AI | Paste | Import)
    ├── AgentNameInput
    ├── DescriptionInput / PasteTextarea / URLInput
    │
    └── AgentEditorModal (new)
        ├── MarkdownEditor (@uiw/react-md-editor)
        ├── MarkdownPreview (react-markdown)
        ├── StreamingIndicator
        ├── ActionButtons
        │   ├── RefineButton (triggers AI refinement)
        │   ├── SaveButton (saves to filesystem)
        │   └── CancelButton
        └── ErrorBoundary
```

---

## API Integration Strategy

### Gemini API Setup

#### Package Choice: `@google/genai` (Latest, EOL: none)

**Why not `@google/generative-ai`?**
- Old package, EOL August 31, 2025
- No Gemini 2.0 features
- Deprecated by Google

**Why `@google/genai`?**
- Current recommended SDK (2025)
- Supports Gemini 2.0+ features
- Unified API for both Gemini API and Vertex AI
- Active development and support

#### Installation

```bash
npm install @google/genai
```

#### Environment Variables

```env
# .env.local (server-side only, never exposed to client)
GEMINI_API_KEY=your_api_key_here
```

#### API Route Implementation

**File**: `/app/api/agents/generate/route.ts`

```typescript
import { GoogleGenerativeAI } from '@google/genai'
import { NextRequest } from 'next/server'
import { z } from 'zod'

// Validation schema
const generateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  existingMarkdown: z.string().optional(), // For refinement
  refinementPrompt: z.string().optional(),
})

// Initialize Gemini client (server-side only)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp' // Fast, cost-effective
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json()
    const { name, description, existingMarkdown, refinementPrompt } =
      generateAgentSchema.parse(body)

    // Construct system prompt
    const systemPrompt = buildAgentPrompt(name, description, existingMarkdown, refinementPrompt)

    // Set up Server-Sent Events (SSE)
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream response from Gemini
          const result = await model.generateContentStream({
            contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.7,
            },
          })

          // Stream chunks to client
          for await (const chunk of result.stream) {
            const text = chunk.text()
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
            )
          }

          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          // Handle errors
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[API] /api/agents/generate error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate agent' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Build structured prompt for Gemini
function buildAgentPrompt(
  name: string,
  description: string,
  existingMarkdown?: string,
  refinementPrompt?: string
): string {
  const agentTemplate = `# Agent Markdown Template

An agent markdown file follows this structure:

---
name: agent-name
description: Brief one-line description of the agent's purpose
tools: Read, Write, Edit, Glob, Grep, Bash, Task, mcp__*
---

# Agent Name

## Purpose
Clear, concise statement of the agent's primary purpose (1-2 sentences).

## Available MCP Servers (if applicable)
- **mcp__github**: GitHub operations (PRs, issues, commits)
- **mcp__filesystem**: File operations (read, write, manage)
- **mcp__sequential-thinking**: Break down complex tasks
- **mcp__context7**: Access real-time documentation
- **mcp__playwright**: Browser automation (always use DISPLAY=:99)

## Capabilities
- **Capability 1**: Description
- **Capability 2**: Description
- **Capability 3**: Description

## Responsibilities
1. Primary responsibility
2. Secondary responsibility
3. Additional responsibilities

## Implementation Workflow / Usage Instructions

### Starting a Task
1. Step-by-step instructions
2. Commands to run
3. Tools to use

### Example Workflow
\`\`\`bash
# Commands and examples
\`\`\`

## Activity Logging
\`\`\`typescript
await prisma.activityLog.create({
  data: {
    agent: 'agent-name',
    action: 'action_name',
    details: 'Description of what was done',
    level: 'info'
  }
})
\`\`\`

## Integration Points
- **With Agent A**: How they collaborate
- **With Agent B**: Handoff scenarios

## Best Practices
- Practice 1
- Practice 2
- Practice 3

## Expected Deliverables
- Deliverable 1
- Deliverable 2

## Success Metrics
- Metric 1
- Metric 2
`

  if (existingMarkdown && refinementPrompt) {
    // Refinement mode
    return `You are an AI agent documentation expert. Refine the following agent markdown based on the user's request.

**User's Refinement Request**: ${refinementPrompt}

**Current Agent Markdown**:
${existingMarkdown}

**Instructions**:
- Keep the same frontmatter structure (name, description, tools)
- Make targeted improvements based on the user's request
- Maintain consistent markdown formatting
- Keep the overall structure intact unless changes are specifically requested
- Output ONLY the refined markdown, no explanations

**Refined Agent Markdown**:`
  } else {
    // Initial generation mode
    return `You are an AI agent documentation expert. Generate a complete agent markdown file based on the following requirements.

**Agent Name**: ${name}
**Agent Description**: ${description}

**Template Structure**:
${agentTemplate}

**Instructions**:
- Generate a complete, production-ready agent markdown file
- Follow the template structure exactly
- Use clear, professional language
- Include realistic examples and commands
- Ensure all sections are filled with relevant content
- Use proper markdown formatting
- Include relevant MCP servers if applicable
- Make capability and responsibility lists specific and actionable
- Output ONLY the markdown content, no additional explanations

**Generated Agent Markdown**:`
  }
}
```

#### Client-Side Streaming Consumer

**File**: `components/agents/useAgentGeneration.ts`

```typescript
import { useState, useCallback } from 'react'

export function useAgentGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedMarkdown, setGeneratedMarkdown] = useState('')
  const [error, setError] = useState<string | null>(null)

  const generateAgent = useCallback(
    async (params: {
      name: string
      description: string
      existingMarkdown?: string
      refinementPrompt?: string
    }) => {
      setIsGenerating(true)
      setError(null)
      setGeneratedMarkdown('')

      try {
        const response = await fetch('/api/agents/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        })

        if (!response.ok) {
          throw new Error('Failed to generate agent')
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('No response body')
        }

        let markdown = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                setIsGenerating(false)
                return markdown
              }

              try {
                const parsed = JSON.parse(data)
                if (parsed.error) {
                  throw new Error(parsed.error)
                }
                if (parsed.chunk) {
                  markdown += parsed.chunk
                  setGeneratedMarkdown(markdown)
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }

        return markdown
      } catch (err: any) {
        setError(err.message || 'Failed to generate agent')
        setIsGenerating(false)
        throw err
      }
    },
    []
  )

  const reset = useCallback(() => {
    setGeneratedMarkdown('')
    setError(null)
    setIsGenerating(false)
  }, [])

  return {
    generateAgent,
    isGenerating,
    generatedMarkdown,
    error,
    reset,
  }
}
```

### Import from URL

**File**: `/app/api/agents/import-url/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const importSchema = z.object({
  url: z.string().url(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = importSchema.parse(body)

    // Fetch markdown from URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MI-AI-Coding-Platform/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch from URL: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text') && !contentType.includes('markdown')) {
      throw new Error('URL does not return text/markdown content')
    }

    const markdown = await response.text()

    // Basic validation: check for frontmatter
    if (!markdown.startsWith('---')) {
      throw new Error('Invalid agent format: missing frontmatter')
    }

    return NextResponse.json({ markdown })
  } catch (error: any) {
    console.error('[API] /api/agents/import-url error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import agent' },
      { status: 400 }
    )
  }
}
```

---

## Component Structure

### 1. CreateAgentModal Component

**File**: `components/agents/CreateAgentModal.tsx`

**Responsibilities**:
- Display initial creation mode selection
- Collect agent name and description/paste/URL
- Navigate to AgentEditorModal after generation/paste/import

**Props**:
```typescript
interface CreateAgentModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (agentName: string) => void
}
```

**State**:
```typescript
const [mode, setMode] = useState<'ai' | 'paste' | 'import'>('ai')
const [agentName, setAgentName] = useState('')
const [description, setDescription] = useState('')
const [pastedMarkdown, setPastedMarkdown] = useState('')
const [importUrl, setImportUrl] = useState('')
const [loading, setLoading] = useState(false)
```

**UI Structure**:
```tsx
<Modal title="Create New Agent" open={open} onCancel={onClose}>
  {/* Mode Tabs */}
  <Tabs activeKey={mode} onChange={setMode}>
    <TabPane tab="AI Generate" key="ai">
      <Input placeholder="Agent Name (e.g., code-reviewer)" />
      <TextArea
        placeholder="Describe what this agent should do..."
        rows={4}
      />
      <Button type="primary" onClick={handleGenerate}>
        Generate with AI
      </Button>
    </TabPane>

    <TabPane tab="Paste Markdown" key="paste">
      <Input placeholder="Agent Name" />
      <TextArea
        placeholder="Paste agent markdown here..."
        rows={10}
      />
      <Button type="primary" onClick={handlePaste}>
        Continue to Editor
      </Button>
    </TabPane>

    <TabPane tab="Import from URL" key="import">
      <Input placeholder="Agent Name" />
      <Input placeholder="https://example.com/agent.md" />
      <Button type="primary" onClick={handleImport}>
        Import Agent
      </Button>
    </TabPane>
  </Tabs>
</Modal>
```

### 2. AgentEditorModal Component

**File**: `components/agents/AgentEditorModal.tsx`

**Responsibilities**:
- Display markdown editor with live preview
- Show streaming AI generation progress
- Handle iterative refinement
- Save agent to filesystem
- Activity logging

**Props**:
```typescript
interface AgentEditorModalProps {
  open: boolean
  agentName: string
  initialMarkdown: string
  isGenerating?: boolean
  onClose: () => void
  onSave: (markdown: string) => Promise<void>
  onRefine?: (prompt: string) => Promise<void>
}
```

**State**:
```typescript
const [markdown, setMarkdown] = useState(initialMarkdown)
const [refinementPrompt, setRefinementPrompt] = useState('')
const [showRefineInput, setShowRefineInput] = useState(false)
const [saving, setSaving] = useState(false)
```

**UI Structure**:
```tsx
<Modal
  title={`Edit Agent: ${agentName}`}
  open={open}
  onCancel={onClose}
  width="90vw"
  style={{ top: 20 }}
  footer={null}
>
  <div className="flex gap-4 h-[80vh]">
    {/* Left: Editor */}
    <div className="flex-1 flex flex-col">
      <MDEditor
        value={markdown}
        onChange={setMarkdown}
        height="100%"
        preview="edit"
      />

      {isGenerating && (
        <Progress percent={100} status="active" />
      )}
    </div>

    {/* Right: Preview */}
    <div className="flex-1 overflow-auto border rounded p-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  </div>

  {/* Action Bar */}
  <div className="flex gap-2 mt-4">
    {showRefineInput ? (
      <>
        <Input
          placeholder="How should I refine this agent?"
          value={refinementPrompt}
          onChange={(e) => setRefinementPrompt(e.target.value)}
          onPressEnter={handleRefine}
        />
        <Button onClick={handleRefine} disabled={isGenerating}>
          Apply Refinement
        </Button>
        <Button onClick={() => setShowRefineInput(false)}>
          Cancel
        </Button>
      </>
    ) : (
      <>
        <Button
          icon={<ThunderboltOutlined />}
          onClick={() => setShowRefineInput(true)}
          disabled={isGenerating}
        >
          Refine with AI
        </Button>
        <Button
          type="primary"
          onClick={handleSave}
          loading={saving}
          disabled={isGenerating}
        >
          Save Agent
        </Button>
        <Button onClick={onClose}>
          Cancel
        </Button>
      </>
    )}
  </div>
</Modal>
```

### 3. FileTree Component (Modification)

**File**: `components/file-explorer/FileTree.tsx` (existing)

**Changes Required**:

```tsx
// Add state for current path detection
const isAgentsFolder = currentPath === '/home/master/projects/agents'

// Modify button rendering
{isAgentsFolder ? (
  <Button
    size="small"
    type="primary"
    icon={<RobotOutlined />}
    onClick={() => setIsCreateAgentModalOpen(true)}
    title="New Agent"
  >
    Agent
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

// Add CreateAgentModal
<CreateAgentModal
  open={isCreateAgentModalOpen}
  onClose={() => setIsCreateAgentModalOpen(false)}
  onSuccess={(agentName) => {
    message.success(`Agent ${agentName} created!`)
    loadFiles(currentPath)
  }}
/>
```

---

## State Management

### Modal State Machine

```
[FileTree]
   ↓ Click "+Agent" (in /home/master/projects/agents)

[CreateAgentModal: mode selection]
   ├─ AI Mode
   │   ↓ Enter name + description
   │   ↓ Click "Generate"
   │   ↓ Call /api/agents/generate (streaming)
   │
   ├─ Paste Mode
   │   ↓ Enter name + paste markdown
   │   ↓ Click "Continue"
   │
   └─ Import Mode
       ↓ Enter name + URL
       ↓ Click "Import"
       ↓ Call /api/agents/import-url

[AgentEditorModal: edit/refine]
   ├─ Edit markdown manually
   ├─ Preview live
   ├─ Optional: Click "Refine with AI"
   │   ↓ Enter refinement prompt
   │   ↓ Call /api/agents/generate (streaming, with existing markdown)
   │   ↓ Update markdown in editor
   │
   └─ Click "Save"
       ↓ Call /api/filesystem/create-file
       ↓ Log to ActivityLog
       ↓ Close modal
       ↓ Refresh FileTree

[FileTree: agent file appears]
```

### Context/Provider (Optional)

For complex state sharing, consider a context:

**File**: `providers/AgentCreationProvider.tsx`

```typescript
interface AgentCreationContextType {
  currentAgent: {
    name: string
    markdown: string
  } | null
  isGenerating: boolean
  createAgent: (name: string, description: string) => Promise<void>
  refineAgent: (prompt: string) => Promise<void>
  saveAgent: () => Promise<void>
  reset: () => void
}

export const AgentCreationProvider = ({ children }) => {
  // State management logic
  return (
    <AgentCreationContext.Provider value={...}>
      {children}
    </AgentCreationContext.Provider>
  )
}
```

---

## UI/UX Flow

### User Journey: AI-Generated Agent

**Step 1: Navigate to Agents Folder**
- User clicks "Agents" quick access button in FileTree
- Current path: `/home/master/projects/agents`
- Button changes from "+File" to "+Agent"

**Step 2: Open Create Modal**
- User clicks "+Agent" button
- CreateAgentModal opens
- Default tab: "AI Generate"

**Step 3: Enter Details**
- User enters agent name: `code-reviewer`
- User enters description: "Review code for best practices, security issues, and optimization opportunities"
- Click "Generate with AI"

**Step 4: Generation (Streaming)**
- CreateAgentModal closes
- AgentEditorModal opens immediately
- Left pane: Markdown editor (initially empty)
- Right pane: Live preview
- Bottom: Progress indicator "Generating..."
- Markdown appears character-by-character as streaming happens
- Preview updates in real-time
- Duration: ~5-15 seconds

**Step 5: Review & Edit**
- Generation completes
- User reviews generated markdown
- User can manually edit in left pane
- Preview updates instantly
- User notices missing section

**Step 6: Refine (Optional)**
- User clicks "Refine with AI" button
- Input field appears: "Add a section on integration with CI/CD pipelines"
- User presses Enter or clicks "Apply Refinement"
- Streaming begins again
- Editor updates with refined content
- User can refine multiple times

**Step 7: Save**
- User satisfied with result
- Clicks "Save Agent" button
- API call: POST /api/filesystem/create-file
- Activity log entry created
- Success message: "Agent code-reviewer created!"
- Modal closes
- FileTree refreshes
- New file appears: `code-reviewer.md`

### User Journey: Paste Existing Markdown

**Step 1-2**: Same as AI-generated

**Step 3: Switch to Paste Mode**
- User clicks "Paste Markdown" tab
- Enters agent name: `data-analyst`
- Pastes markdown from clipboard
- Click "Continue to Editor"

**Step 4: Edit**
- AgentEditorModal opens with pasted content
- User reviews and edits as needed
- Click "Save Agent"

**Step 5**: Same as AI-generated Step 7

### User Journey: Import from URL

**Step 1-2**: Same as AI-generated

**Step 3: Switch to Import Mode**
- User clicks "Import from URL" tab
- Enters agent name: `api-tester`
- Enters URL: `https://gist.github.com/user/agent.md`
- Click "Import Agent"

**Step 4: Loading**
- API call: POST /api/agents/import-url
- Loading spinner
- Markdown fetched and validated

**Step 5-6**: Same as AI-generated Steps 5-7

### Progressive Disclosure

- **Simple Path**: AI Generate → Save (2 clicks)
- **Advanced Path**: AI Generate → Edit → Refine → Edit → Save (5+ clicks)
- **Expert Path**: Paste → Save (2 clicks)

### Mobile Responsiveness

- Editor modal: Full screen on mobile (<768px)
- Split view on tablet (768-1024px)
- Side-by-side on desktop (>1024px)
- Markdown editor height adapts to viewport

---

## Technical Decisions

### 1. Gemini SDK Choice

**Decision**: Use `@google/genai` (not `@google/generative-ai`)

**Rationale**:
- Current official SDK (2025)
- No EOL concerns
- Gemini 2.0+ support
- Unified API for Gemini API and Vertex AI

**Alternatives Considered**:
- `@google/generative-ai`: EOL Aug 2025, deprecated
- OpenAI API: More expensive, no specific need for GPT-4

### 2. Model Selection

**Decision**: `gemini-2.0-flash-exp`

**Rationale**:
- Fast response (important for streaming UX)
- Cost-effective (~$0.075 per 1M tokens input)
- Sufficient quality for structured markdown generation
- 8192 token output limit (adequate for agent docs)

**Alternatives Considered**:
- `gemini-2.0-pro`: Slower, more expensive, overkill for this use case
- `gemini-1.5-flash`: Older model, less capable

### 3. Markdown Editor

**Decision**: `@uiw/react-md-editor`

**Rationale**:
- Built-in preview pane
- TypeScript support
- Syntax highlighting included
- Lightweight (~100KB gzipped)
- Active maintenance
- Compatible with React 19

**Alternatives Considered**:
- `react-markdown-editor-lite`: Less feature-rich
- `MDXEditor`: Overkill (WYSIWYG, we want raw markdown)
- Monaco Editor: Already in use for code, but heavy for markdown

### 4. Markdown Preview

**Decision**: `react-markdown` + `remark-gfm` + `rehype-highlight`

**Rationale**:
- Industry standard for React markdown rendering
- Plugin ecosystem (GFM tables, syntax highlighting)
- Secure (doesn't use dangerouslySetInnerHTML)
- Works with `@uiw/react-md-editor`

**Installation**:
```bash
npm install react-markdown remark-gfm rehype-highlight
```

### 5. Streaming Implementation

**Decision**: Server-Sent Events (SSE)

**Rationale**:
- Built-in browser support (EventSource API)
- Simpler than WebSockets for one-way streaming
- Compatible with Next.js API routes
- Automatic reconnection

**Alternatives Considered**:
- WebSocket: Overkill for one-way streaming
- Long polling: Inefficient, poor UX

### 6. State Management

**Decision**: Component-level state (useState + custom hook)

**Rationale**:
- Localized state (doesn't need global access)
- Reduces complexity
- Custom hook (`useAgentGeneration`) encapsulates logic
- Can upgrade to Context/Zustand if needed later

**Alternatives Considered**:
- Redux: Too heavy for this feature
- Zustand: Not needed yet, can add later
- Context API: May implement if state grows

### 7. Validation Library

**Decision**: Zod

**Rationale**:
- Already in project (dependencies)
- TypeScript-first
- Runtime validation + type inference
- Great error messages

---

## File Structure

```
/home/master/projects/mi-ai-coding/

├── app/
│   └── api/
│       └── agents/
│           ├── generate/
│           │   └── route.ts          # NEW: AI generation endpoint (SSE streaming)
│           ├── import-url/
│           │   └── route.ts          # NEW: Import from URL endpoint
│           └── route.ts              # EXISTING: List agents endpoint
│
├── components/
│   ├── agents/
│   │   ├── CreateAgentModal.tsx     # NEW: Initial creation modal
│   │   ├── AgentEditorModal.tsx     # NEW: Markdown editor with preview
│   │   ├── useAgentGeneration.ts    # NEW: Custom hook for AI generation
│   │   └── AgentDeployModal.tsx     # EXISTING: Deploy to project modal
│   │
│   └── file-explorer/
│       └── FileTree.tsx              # MODIFIED: Add conditional "+Agent" button
│
├── lib/
│   └── gemini.ts                     # NEW: Gemini client utilities
│
├── docs/
│   └── AGENT_CREATION_IMPLEMENTATION_PLAN.md  # THIS DOCUMENT
│
├── .env.local
│   └── GEMINI_API_KEY=...            # NEW: Server-side API key
│
└── package.json
    └── dependencies:
        ├── @google/genai              # NEW: Gemini SDK
        ├── @uiw/react-md-editor       # NEW: Markdown editor
        ├── react-markdown             # NEW: Markdown preview
        ├── remark-gfm                 # NEW: GitHub Flavored Markdown
        └── rehype-highlight           # NEW: Syntax highlighting
```

---

## Implementation Phases

### Phase 1: Setup & Infrastructure (2-3 hours)

**Goal**: Install dependencies, set up API key, create basic structure

**Tasks**:
1. Install NPM packages
   ```bash
   npm install @google/genai @uiw/react-md-editor react-markdown remark-gfm rehype-highlight
   npm install --save-dev @types/react-markdown
   ```

2. Add environment variable
   ```bash
   echo "GEMINI_API_KEY=your_key_here" >> .env.local
   ```

3. Create file structure
   ```bash
   mkdir -p app/api/agents/generate
   mkdir -p app/api/agents/import-url
   touch app/api/agents/generate/route.ts
   touch app/api/agents/import-url/route.ts
   touch components/agents/CreateAgentModal.tsx
   touch components/agents/AgentEditorModal.tsx
   touch components/agents/useAgentGeneration.ts
   touch lib/gemini.ts
   ```

4. Create Gemini utility file
   ```typescript
   // lib/gemini.ts
   import { GoogleGenerativeAI } from '@google/genai'

   export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
   export const model = genAI.getGenerativeModel({
     model: 'gemini-2.0-flash-exp'
   })
   ```

**Success Criteria**:
- All packages installed
- API key configured
- File structure created
- No TypeScript errors

### Phase 2: API Routes (3-4 hours)

**Goal**: Implement streaming generation and URL import endpoints

**Tasks**:
1. Implement `/api/agents/generate` with SSE streaming (see [API Integration Strategy](#api-integration-strategy))
2. Implement `/api/agents/import-url` with URL fetching
3. Create Zod validation schemas
4. Test endpoints with Postman/curl
5. Add error handling and logging
6. Log to ActivityLog

**Testing**:
```bash
# Test generation endpoint
curl -X POST http://localhost:3000/api/agents/generate \
  -H "Content-Type: application/json" \
  -d '{"name":"test-agent","description":"A test agent for validation"}'

# Test import endpoint
curl -X POST http://localhost:3000/api/agents/import-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://raw.githubusercontent.com/user/agent.md"}'
```

**Success Criteria**:
- Streaming works (chunks appear in real-time)
- Import fetches markdown correctly
- Errors handled gracefully
- Activity logs created

### Phase 3: Custom Hook (2 hours)

**Goal**: Create reusable hook for agent generation logic

**Tasks**:
1. Implement `useAgentGeneration` hook (see [API Integration Strategy](#api-integration-strategy))
2. Handle streaming state management
3. Error handling and retry logic
4. Reset functionality

**Testing**:
- Create simple test component to verify hook behavior

**Success Criteria**:
- Hook connects to API correctly
- Streaming updates state in real-time
- Errors propagated properly

### Phase 4: CreateAgentModal (3-4 hours)

**Goal**: Build initial creation modal with 3 modes

**Tasks**:
1. Create modal component
2. Implement mode tabs (AI | Paste | Import)
3. Add form validation
4. Connect to `useAgentGeneration` hook
5. Handle mode-specific logic
6. Add loading states

**Testing**:
- Test each mode independently
- Validate form inputs
- Verify navigation to editor modal

**Success Criteria**:
- All 3 modes functional
- Form validation works
- Loading states display correctly
- Modal closes/opens smoothly

### Phase 5: AgentEditorModal (4-5 hours)

**Goal**: Build markdown editor with live preview and refinement

**Tasks**:
1. Integrate `@uiw/react-md-editor`
2. Implement live preview with `react-markdown`
3. Add syntax highlighting (rehype-highlight)
4. Implement refinement UI
5. Connect refinement to API
6. Add save functionality
7. Responsive layout (split on desktop, tabs on mobile)

**Testing**:
- Test editor functionality
- Verify preview updates
- Test refinement flow
- Test save to filesystem
- Test on mobile viewport

**Success Criteria**:
- Editor displays markdown correctly
- Preview renders properly
- Refinement works with streaming
- Save creates file in correct location
- Responsive on all screen sizes

### Phase 6: FileTree Integration (1-2 hours)

**Goal**: Add conditional button and modal integration

**Tasks**:
1. Modify FileTree to detect current path
2. Add conditional button rendering
3. Integrate CreateAgentModal
4. Handle modal lifecycle
5. Refresh tree after save

**Testing**:
- Navigate to /home/master/projects/agents
- Verify button changes
- Create agent and verify file appears

**Success Criteria**:
- Button changes based on path
- Modal opens correctly
- File appears after save
- Tree refreshes automatically

### Phase 7: Testing & Polish (3-4 hours)

**Goal**: End-to-end testing, error handling, and UX improvements

**Tasks**:
1. Write E2E test with Playwright
2. Test error scenarios (API failures, invalid input)
3. Add loading skeletons
4. Improve error messages
5. Add success animations
6. Update ActivityLog entries
7. Update PROGRESS.md and documentation

**E2E Test Example**:
```typescript
// tests/e2e/agent-creation.spec.ts
import { test, expect } from '@playwright/test'

test('should create agent with AI generation', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard')

  // Navigate to agents folder
  await page.click('text=Agents')

  // Click +Agent button
  await page.click('button:has-text("Agent")')

  // Fill form
  await page.fill('input[placeholder*="Agent Name"]', 'test-agent')
  await page.fill('textarea[placeholder*="Describe"]', 'A test agent for E2E testing')

  // Generate
  await page.click('button:has-text("Generate with AI")')

  // Wait for generation
  await page.waitForSelector('text=Generating...', { state: 'hidden', timeout: 30000 })

  // Verify markdown appears
  await expect(page.locator('.wmde-markdown')).toContainText('test-agent')

  // Save
  await page.click('button:has-text("Save Agent")')

  // Verify success
  await expect(page.locator('.ant-message')).toContainText('created')

  // Verify file appears in tree
  await expect(page.locator('.ant-tree')).toContainText('test-agent.md')
})
```

**Success Criteria**:
- All E2E tests pass
- Error scenarios handled
- UX feels smooth and responsive
- Documentation updated

### Phase 8: Deployment & Monitoring (1-2 hours)

**Goal**: Deploy to production and set up monitoring

**Tasks**:
1. Add GEMINI_API_KEY to production environment
2. Test in staging environment
3. Deploy to production
4. Monitor API usage and costs
5. Set up error tracking (Sentry/LogRocket)
6. Create usage dashboard

**Success Criteria**:
- Feature works in production
- API key secure
- Monitoring in place
- No unexpected costs

---

## Security Considerations

### 1. API Key Protection

**Critical**: NEVER expose `GEMINI_API_KEY` to the client

**Implementation**:
```typescript
// ❌ WRONG - Client-side code
'use client'
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY // NEVER DO THIS

// ✅ CORRECT - Server-side API route
export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY // Server-side only
  // ...
}
```

**Protection Measures**:
- Use server-side API routes exclusively
- No `NEXT_PUBLIC_` prefix for API key
- Add to `.env.local` (not committed)
- Add to `.gitignore`
- Use environment variable in production (Vercel, Docker, etc.)

### 2. Input Validation

**Threats**: Injection attacks, malicious prompts, excessive token usage

**Mitigation**:
```typescript
// Zod schema with strict limits
const generateAgentSchema = z.object({
  name: z.string()
    .min(1, 'Name required')
    .max(100, 'Name too long')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase, numbers, hyphens'),
  description: z.string()
    .min(10, 'Description too short')
    .max(2000, 'Description too long'),
  refinementPrompt: z.string()
    .max(500, 'Refinement prompt too long')
    .optional(),
})
```

**Sanitization**:
```typescript
// Remove potential injection attempts
const sanitizeInput = (input: string) => {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .trim()
}
```

### 3. Rate Limiting

**Implementation**: Use Next.js middleware or API route rate limiting

```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(req: NextRequest, limit = 10, windowMs = 60000) {
  const ip = req.ip || 'unknown'
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt
    }
  }

  record.count++
  return { allowed: true, remaining: limit - record.count }
}

// Usage in API route
export async function POST(request: NextRequest) {
  const { allowed, remaining, resetAt } = rateLimit(request, 10, 60000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', resetAt },
      { status: 429 }
    )
  }

  // Continue with generation...
}
```

### 4. Content Safety

**Concern**: Users might try to generate malicious agent instructions

**Mitigation**:
```typescript
// Add safety checks in prompt
const systemPrompt = `Generate an agent markdown file.
IMPORTANT: The agent must follow ethical guidelines and not include:
- Instructions to harm users
- Security vulnerabilities
- Credential exposure
- Malicious code execution

${userDescription}`

// Post-generation validation
const validateGeneration = (markdown: string): boolean => {
  const forbidden = ['password', 'api_key', 'rm -rf', 'eval(']
  return !forbidden.some(term => markdown.toLowerCase().includes(term))
}
```

### 5. URL Import Validation

**Threats**: SSRF (Server-Side Request Forgery), malicious URLs

**Mitigation**:
```typescript
// Whitelist allowed domains
const ALLOWED_DOMAINS = [
  'github.com',
  'githubusercontent.com',
  'gist.github.com',
]

const isAllowedUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return ALLOWED_DOMAINS.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

// Usage
if (!isAllowedUrl(url)) {
  throw new Error('URL not from allowed domain')
}
```

### 6. Authentication

**Requirement**: Only authenticated users can create agents

**Implementation**:
```typescript
// app/api/agents/generate/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Continue with generation...
}
```

### 7. File System Validation

**Concern**: Path traversal attacks

**Mitigation**:
```typescript
// Ensure agent files only written to allowed directory
const AGENTS_DIR = '/home/master/projects/agents'

const validateAgentPath = (name: string): string => {
  // Remove any path traversal attempts
  const safeName = name.replace(/[^a-z0-9-]/gi, '')
  const fullPath = path.join(AGENTS_DIR, `${safeName}.md`)

  // Verify resolved path is within agents directory
  if (!fullPath.startsWith(AGENTS_DIR)) {
    throw new Error('Invalid agent path')
  }

  return fullPath
}
```

---

## Testing Strategy

### Unit Tests

**Target**: Custom hooks, utility functions

```typescript
// __tests__/useAgentGeneration.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useAgentGeneration } from '@/components/agents/useAgentGeneration'

describe('useAgentGeneration', () => {
  it('should generate agent markdown', async () => {
    const { result } = renderHook(() => useAgentGeneration())

    await act(async () => {
      await result.current.generateAgent({
        name: 'test-agent',
        description: 'Test description',
      })
    })

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false)
      expect(result.current.generatedMarkdown).toContain('test-agent')
    })
  })

  it('should handle errors', async () => {
    // Mock fetch to fail
    global.fetch = jest.fn(() => Promise.reject('API Error'))

    const { result } = renderHook(() => useAgentGeneration())

    await expect(async () => {
      await result.current.generateAgent({
        name: 'test',
        description: 'test',
      })
    }).rejects.toThrow()

    expect(result.current.error).toBeTruthy()
  })
})
```

### Integration Tests

**Target**: API routes

```typescript
// __tests__/api/agents/generate.test.ts
import { POST } from '@/app/api/agents/generate/route'
import { NextRequest } from 'next/server'

describe('POST /api/agents/generate', () => {
  it('should return streaming response', async () => {
    const request = new NextRequest('http://localhost/api/agents/generate', {
      method: 'POST',
      body: JSON.stringify({
        name: 'test-agent',
        description: 'Test description',
      }),
    })

    const response = await POST(request)

    expect(response.headers.get('content-type')).toBe('text/event-stream')
    expect(response.status).toBe(200)
  })

  it('should validate input', async () => {
    const request = new NextRequest('http://localhost/api/agents/generate', {
      method: 'POST',
      body: JSON.stringify({
        name: '', // Invalid: empty name
        description: 'Test',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

### E2E Tests (Playwright)

**Target**: Complete user flows

```typescript
// tests/e2e/agent-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Agent Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await page.click('text=Agents') // Navigate to agents folder
  })

  test('AI generation flow', async ({ page }) => {
    await page.click('button:has-text("Agent")')
    await page.fill('input[placeholder*="Agent Name"]', 'e2e-test-agent')
    await page.fill('textarea', 'An agent for E2E testing')
    await page.click('button:has-text("Generate")')

    // Wait for streaming to complete
    await page.waitForSelector('text=Generating...', { state: 'hidden' })

    // Verify editor opens
    await expect(page.locator('.wmde-markdown')).toBeVisible()

    // Save agent
    await page.click('button:has-text("Save")')

    // Verify success
    await expect(page.locator('.ant-message')).toContainText('created')
    await expect(page.locator('.ant-tree')).toContainText('e2e-test-agent.md')
  })

  test('paste mode flow', async ({ page }) => {
    await page.click('button:has-text("Agent")')
    await page.click('text=Paste Markdown')
    await page.fill('input[placeholder*="Agent Name"]', 'pasted-agent')
    await page.fill('textarea', '---\nname: pasted\n---\n# Test Agent')
    await page.click('button:has-text("Continue")')

    await expect(page.locator('.wmde-markdown')).toBeVisible()
    await page.click('button:has-text("Save")')

    await expect(page.locator('.ant-message')).toContainText('created')
  })

  test('refinement flow', async ({ page }) => {
    // Generate initial agent
    await page.click('button:has-text("Agent")')
    await page.fill('input[placeholder*="Agent Name"]', 'refinement-test')
    await page.fill('textarea', 'A simple agent')
    await page.click('button:has-text("Generate")')
    await page.waitForSelector('text=Generating...', { state: 'hidden' })

    // Click refine
    await page.click('button:has-text("Refine")')
    await page.fill('input[placeholder*="How should"]', 'Add more examples')
    await page.press('input[placeholder*="How should"]', 'Enter')

    // Wait for refinement
    await page.waitForSelector('text=Generating...', { state: 'hidden' })

    // Verify content updated
    const markdown = await page.locator('.wmde-markdown').textContent()
    expect(markdown).toBeTruthy()
  })

  test('error handling', async ({ page }) => {
    // Simulate API error by entering invalid data
    await page.click('button:has-text("Agent")')
    await page.fill('input[placeholder*="Agent Name"]', 'a') // Too short
    await page.click('button:has-text("Generate")')

    // Should show error message
    await expect(page.locator('.ant-message-error')).toBeVisible()
  })
})
```

### Manual Testing Checklist

- [ ] AI generation works on first try
- [ ] Streaming displays smoothly
- [ ] Paste mode accepts valid markdown
- [ ] Import from GitHub gist works
- [ ] Refinement updates existing markdown
- [ ] Multiple refinements work
- [ ] Save creates file in correct location
- [ ] File appears in tree after save
- [ ] Activity log entries created
- [ ] Button changes based on current path
- [ ] Modal closes properly
- [ ] Responsive on mobile (editor stacks vertically)
- [ ] Error messages are clear and actionable
- [ ] Rate limiting prevents abuse
- [ ] Invalid input rejected
- [ ] API key never exposed to client

---

## Cost & Rate Limiting

### Gemini API Pricing (2025)

**Model**: `gemini-2.0-flash-exp`

| Operation | Cost per 1M tokens |
|-----------|-------------------|
| Input     | $0.075            |
| Output    | $0.30             |

### Cost Estimation

**Assumptions**:
- Average agent generation: 500 input tokens + 2000 output tokens
- 100 agents generated per day

**Daily Cost**:
```
Input:  (500 tokens × 100 agents) / 1,000,000 × $0.075  = $0.00375
Output: (2000 tokens × 100 agents) / 1,000,000 × $0.30  = $0.06
Total per day: ~$0.064
```

**Monthly Cost**: ~$1.92 for 3000 agent generations

**Cost per agent**: ~$0.0006 (negligible)

### Rate Limiting Strategy

**Per User Limits**:
- 10 generations per hour
- 50 generations per day
- 500 generations per month

**Global Limits**:
- 100 concurrent streaming requests
- 10,000 generations per day (organization-wide)

**Implementation**:
```typescript
// lib/rate-limit.ts
interface RateLimit {
  hourly: { limit: 10, window: 3600000 }
  daily: { limit: 50, window: 86400000 }
  monthly: { limit: 500, window: 2592000000 }
}

// Track per user ID (from session)
const userLimits = new Map<string, {
  hourly: { count: number, resetAt: number }
  daily: { count: number, resetAt: number }
  monthly: { count: number, resetAt: number }
}>()

// Usage in API route
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowed = checkRateLimit(userId)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429 }
    )
  }

  // Continue with generation...
}
```

### Monitoring & Alerts

**Metrics to Track**:
- Total API calls per day
- Cost per day
- Average tokens per generation
- Error rate
- Rate limit hits

**Dashboard** (example with Prisma):
```typescript
// Track in database
model AgentGeneration {
  id              String   @id @default(cuid())
  userId          String
  agentName       String
  tokensInput     Int
  tokensOutput    Int
  cost            Float
  durationMs      Int
  status          String   // 'success' | 'error' | 'rate_limited'
  createdAt       DateTime @default(now())
}

// Query for dashboard
const dailyStats = await prisma.agentGeneration.aggregate({
  where: {
    createdAt: { gte: startOfDay(new Date()) }
  },
  _sum: {
    tokensInput: true,
    tokensOutput: true,
    cost: true,
  },
  _count: true,
})
```

**Alerts**:
- Email if daily cost > $10
- Slack notification if error rate > 5%
- Warning if approaching rate limits

---

## Appendix

### A. Agent Markdown Template (Full)

```markdown
---
name: agent-name
description: Brief one-line description of agent's purpose
tools: Read, Write, Edit, Glob, Grep, Bash, Task, mcp__*
---

# Agent Name

## Purpose
Clear, concise statement of the agent's primary purpose (1-2 sentences).

## Available MCP Servers
- **mcp__github**: GitHub operations (PRs, issues, commits, search)
- **mcp__filesystem**: File operations (read, write, list, search)
- **mcp__sequential-thinking**: Break down complex tasks into steps
- **mcp__context7**: Access real-time, version-specific documentation
- **mcp__playwright**: Browser automation (always use DISPLAY=:99)

## Capabilities
- **Capability 1**: Detailed description
- **Capability 2**: Detailed description
- **Capability 3**: Detailed description

## Responsibilities
1. Primary responsibility
2. Secondary responsibility
3. Additional responsibilities

## Implementation Workflow

### Starting a Task
1. Step-by-step instructions
2. Commands to run
3. Tools to use

### Example Workflow
\`\`\`bash
# Example commands
cd /path/to/project
npm install
npm run dev
\`\`\`

## Activity Logging
\`\`\`typescript
await prisma.activityLog.create({
  data: {
    agent: 'agent-name',
    action: 'action_name',
    details: 'Description of what was done',
    level: 'info' // info | warning | error
  }
})
\`\`\`

## Integration Points
- **With Agent A**: How they collaborate
- **With Agent B**: Handoff scenarios
- **With Agent C**: Communication protocols

## Best Practices
- Best practice 1
- Best practice 2
- Best practice 3

## Expected Deliverables
- Deliverable 1
- Deliverable 2
- Deliverable 3

## Success Metrics
- Metric 1: Target
- Metric 2: Target
- Metric 3: Target
```

### B. Example Prompt for Gemini

**User Input**:
- Name: `code-reviewer`
- Description: "Review code for best practices, security vulnerabilities, and performance issues. Provide actionable feedback."

**Constructed Prompt** (sent to Gemini):
```
You are an AI agent documentation expert. Generate a complete agent markdown file based on the following requirements.

**Agent Name**: code-reviewer
**Agent Description**: Review code for best practices, security vulnerabilities, and performance issues. Provide actionable feedback.

**Template Structure**:
[Full template from Appendix A]

**Instructions**:
- Generate a complete, production-ready agent markdown file
- Follow the template structure exactly
- Use clear, professional language
- Include realistic examples and commands
- Ensure all sections are filled with relevant content
- Use proper markdown formatting
- Include relevant MCP servers if applicable
- Make capability and responsibility lists specific and actionable
- Output ONLY the markdown content, no additional explanations

**Generated Agent Markdown**:
```

**Expected Output**:
```markdown
---
name: code-reviewer
description: Review code for best practices, security vulnerabilities, and performance issues with actionable feedback.
tools: Read, Edit, Grep, Bash, mcp__github, mcp__filesystem, mcp__sequential-thinking
---

# Code Reviewer Agent

## Purpose
Perform comprehensive code reviews to identify best practice violations, security vulnerabilities, and performance bottlenecks, providing developers with clear, actionable feedback.

## Available MCP Servers
- **mcp__github**: Review PRs, comment on issues, search commit history for patterns
- **mcp__filesystem**: Read codebase files efficiently, analyze project structure
- **mcp__sequential-thinking**: Systematically break down review into logical steps

## Capabilities
- **Security Analysis**: Detect SQL injection, XSS, authentication flaws, exposed secrets
- **Performance Review**: Identify N+1 queries, unnecessary re-renders, memory leaks
- **Best Practices**: Enforce coding standards, DRY principle, SOLID principles
- **Documentation Check**: Verify JSDoc/TSDoc coverage, README completeness
- **Dependency Audit**: Check for outdated packages, known vulnerabilities

## Responsibilities
1. Review all PRs before merging to main branch
2. Provide constructive, specific feedback with examples
3. Suggest concrete fixes with code snippets
4. Flag critical security issues immediately
5. Track recurring issues and suggest architecture improvements
6. Update code review checklist based on common mistakes

## Implementation Workflow

### Starting a Code Review
1. Use mcp__github to fetch PR details and changed files
2. Use mcp__sequential-thinking to plan review approach
3. Use mcp__filesystem to read files and understand context
4. Run linters and static analysis tools
5. Manually review code for logic and security issues

### Example Review Process
\`\`\`bash
# Fetch PR files
gh pr view 42 --json files

# Run static analysis
npm run lint
npm run type-check

# Check for security issues
npm audit

# Review specific file
cat src/components/UserAuth.tsx
\`\`\`

### Review Checklist
- [ ] Code follows project style guide
- [ ] No console.log statements
- [ ] Error handling present
- [ ] Tests included for new features
- [ ] No hardcoded secrets
- [ ] TypeScript types defined (no 'any')
- [ ] Performance considerations addressed
- [ ] Documentation updated

## Activity Logging
\`\`\`typescript
await prisma.activityLog.create({
  data: {
    agent: 'code-reviewer',
    action: 'review_pr',
    details: JSON.stringify({
      prNumber: 42,
      filesReviewed: 8,
      issuesFound: 3,
      severity: ['medium', 'low', 'low'],
      reviewDuration: '15 minutes'
    }),
    level: 'info'
  }
})
\`\`\`

## Integration Points
- **With Full-Stack Developer**: Review completed features before merge
- **With Debugging Agent**: Escalate critical bugs found during review
- **With Documentation Agent**: Verify documentation matches code changes
- **With GitHub Manager**: Approve PRs and request changes via GitHub

## Best Practices
- Be specific: "Move API key to .env.local" not "Fix security issue"
- Be constructive: Suggest solutions, not just problems
- Prioritize: Mark issues as critical, medium, or low
- Be consistent: Apply same standards to all code
- Be educational: Explain *why* something is an issue
- Be timely: Review within 24 hours of PR creation

## Expected Deliverables
- Detailed PR review comments on GitHub
- Security issue summary in ActivityLog
- Suggested fixes with code examples
- Updated code review checklist if new patterns emerge
- Performance improvement recommendations

## Success Metrics
- 100% of PRs reviewed before merge
- Average review time < 2 hours
- 90% of suggestions accepted by developers
- Zero critical security issues reach production
- Review quality rated 4+ out of 5 by team
```

### C. Environment Variable Template

**File**: `.env.local`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mi_ai_coding?schema=public"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# VNC Configuration
TERMINAL_VNC_PORT=6081
PLAYWRIGHT_VNC_PORT=6080
VNC_DISPLAY_98=":98"
VNC_DISPLAY_99=":99"

# Application
APP_PORT=3000
WS_PORT=3001

# NEW: Gemini API (Server-side only)
GEMINI_API_KEY="your-gemini-api-key-here"
```

**Production** (Vercel, Docker, etc.):
- Add `GEMINI_API_KEY` to environment variables in deployment platform
- NEVER commit API key to version control
- Rotate key periodically for security

### D. Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Testing
npm test                 # Run all tests
npm run test:ui          # Playwright UI mode
npm run test:headed      # Playwright headed mode
DISPLAY=:99 npx playwright test tests/e2e/agent-creation.spec.ts

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio

# Linting
npm run lint             # Run ESLint
npm run lint:fix         # Fix lint issues

# Check API key (should return "Key is set")
node -e "console.log(require('dotenv').config(); process.env.GEMINI_API_KEY ? 'Key is set' : 'Key missing')"
```

---

## Conclusion

This implementation plan provides a comprehensive roadmap for adding AI-powered agent creation to the MI AI Coding Platform. The feature leverages Google's Gemini 2.0 Flash model for fast, cost-effective markdown generation with streaming responses, providing an excellent user experience.

Key highlights:
- **3 creation modes**: AI-generated, paste, and import from URL
- **Iterative refinement**: Users can refine agents with additional AI prompts
- **Secure implementation**: API key never exposed to client
- **Cost-effective**: ~$0.0006 per agent generation
- **Production-ready**: Rate limiting, validation, error handling
- **Comprehensive testing**: Unit, integration, and E2E tests

**Estimated Implementation Time**: 20-25 hours total

**Next Steps**:
1. Review this plan with team
2. Get Gemini API key
3. Start with Phase 1 (Setup)
4. Implement incrementally (Phase 2-8)
5. Deploy to staging for testing
6. Monitor costs and usage
7. Deploy to production

---

**Document Version**: 1.0
**Last Updated**: 2025-10-11
**Author**: Claude (Full-Stack Developer Agent)

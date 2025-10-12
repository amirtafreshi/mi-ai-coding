# Agent Creation System - Quick Start Guide

**For**: Developers implementing the AI-powered agent creation feature
**See**: [Full Implementation Plan](./AGENT_CREATION_IMPLEMENTATION_PLAN.md)

---

## TL;DR

Add an AI-powered agent creation system that:
1. Changes "+File" button to "+Agent" when in `/home/master/projects/agents/`
2. Allows creating agents via: AI generation (Gemini), paste, or import from URL
3. Provides markdown editor with live preview
4. Supports iterative refinement with additional AI prompts
5. Costs ~$0.0006 per agent generation

---

## Quick Architecture

```
User clicks "+Agent"
  → CreateAgentModal (3 modes: AI | Paste | Import)
    → AgentEditorModal (markdown editor + live preview)
      → Optional: Refine with AI (iterative)
        → Save to /home/master/projects/agents/{name}.md
```

---

## Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **Gemini SDK** | `@google/genai` | Latest, no EOL, Gemini 2.0 support |
| **Model** | `gemini-2.0-flash-exp` | Fast, cheap ($0.075/1M input tokens) |
| **Markdown Editor** | `@uiw/react-md-editor` | Built-in preview, TypeScript, lightweight |
| **Markdown Preview** | `react-markdown` + plugins | Industry standard, secure |
| **Streaming** | Server-Sent Events (SSE) | Simple, built-in browser support |
| **State Management** | `useState` + custom hook | Localized, no global state needed |
| **Validation** | Zod | Already in project, TypeScript-first |

---

## Installation (5 minutes)

```bash
# Install dependencies
npm install @google/genai @uiw/react-md-editor react-markdown remark-gfm rehype-highlight

# Add API key to .env.local
echo "GEMINI_API_KEY=your_key_here" >> .env.local

# Create file structure
mkdir -p app/api/agents/generate app/api/agents/import-url
mkdir -p components/agents lib
```

---

## Key Files to Create

```
app/api/agents/
├── generate/route.ts       # SSE streaming endpoint (Gemini API)
└── import-url/route.ts     # Fetch markdown from URL

components/agents/
├── CreateAgentModal.tsx    # Initial modal (3 modes)
├── AgentEditorModal.tsx    # Markdown editor + preview
└── useAgentGeneration.ts   # Custom hook for streaming

lib/
└── gemini.ts              # Gemini client utility

components/file-explorer/
└── FileTree.tsx           # MODIFY: Add conditional button
```

---

## API Route Structure

### POST /api/agents/generate

**Input**:
```json
{
  "name": "code-reviewer",
  "description": "Review code for best practices",
  "existingMarkdown": "...",  // Optional (for refinement)
  "refinementPrompt": "..."    // Optional
}
```

**Output**: Server-Sent Events (SSE)
```
data: {"chunk": "---\nname: code-reviewer\n"}
data: {"chunk": "description: Review code\n"}
...
data: [DONE]
```

**Key Code**:
```typescript
import { GoogleGenerativeAI } from '@google/genai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

export async function POST(request: NextRequest) {
  // Validate input with Zod
  // Construct prompt with agent template
  // Stream response with generateContentStream()
  // Return SSE stream
}
```

---

## Component Pseudocode

### CreateAgentModal

```tsx
<Modal>
  <Tabs>
    <Tab key="ai">
      <Input name />
      <TextArea description />
      <Button onClick={handleGenerate}>Generate with AI</Button>
    </Tab>
    <Tab key="paste">
      <Input name />
      <TextArea markdown />
      <Button onClick={handlePaste}>Continue</Button>
    </Tab>
    <Tab key="import">
      <Input name />
      <Input url />
      <Button onClick={handleImport}>Import</Button>
    </Tab>
  </Tabs>
</Modal>
```

### AgentEditorModal

```tsx
<Modal width="90vw">
  <Split>
    <MDEditor value={markdown} onChange={setMarkdown} />
    <ReactMarkdown>{markdown}</ReactMarkdown>
  </Split>

  <Actions>
    {refining ? (
      <Input placeholder="How to refine?" onEnter={refine} />
    ) : (
      <>
        <Button onClick={() => setRefining(true)}>Refine with AI</Button>
        <Button type="primary" onClick={save}>Save Agent</Button>
      </>
    )}
  </Actions>
</Modal>
```

---

## Security Checklist

- [ ] API key in `.env.local` (NOT `.env`)
- [ ] NO `NEXT_PUBLIC_` prefix on API key
- [ ] API routes are server-side only
- [ ] Input validation with Zod (max lengths)
- [ ] Rate limiting (10 per hour per user)
- [ ] URL import whitelist (github.com, etc.)
- [ ] Path validation (only write to agents folder)
- [ ] Authentication check in API routes

---

## Cost Breakdown

**Per Agent**:
- Input: 500 tokens × $0.075/1M = $0.0000375
- Output: 2000 tokens × $0.30/1M = $0.0006
- **Total: ~$0.0006 per agent**

**Monthly** (3000 agents):
- Cost: ~$1.92
- Negligible for most budgets

---

## Testing Strategy

1. **Unit Tests**: Custom hook, utility functions
2. **Integration Tests**: API routes (mock Gemini)
3. **E2E Tests**: Full user flow with Playwright
   ```bash
   DISPLAY=:99 npx playwright test tests/e2e/agent-creation.spec.ts
   ```

---

## Implementation Timeline

| Phase | Tasks | Time |
|-------|-------|------|
| 1. Setup | Install packages, create files | 2-3h |
| 2. API Routes | Implement streaming, import | 3-4h |
| 3. Custom Hook | useAgentGeneration | 2h |
| 4. CreateModal | 3-mode modal | 3-4h |
| 5. EditorModal | Markdown editor + preview | 4-5h |
| 6. FileTree | Conditional button | 1-2h |
| 7. Testing | E2E, polish | 3-4h |
| 8. Deploy | Production setup | 1-2h |
| **TOTAL** | | **20-25h** |

---

## Gotchas / Common Issues

1. **API Key Not Working**: Ensure no `NEXT_PUBLIC_` prefix, restart server after adding to .env.local
2. **Streaming Not Displaying**: Check SSE format (`data: {...}\n\n`)
3. **CORS Errors on Import**: Whitelist domains in import-url route
4. **Rate Limit Too Strict**: Adjust limits in rate-limit.ts
5. **Markdown Not Rendering**: Install `remark-gfm` and `rehype-highlight`
6. **Button Not Changing**: Check currentPath state in FileTree

---

## Example Usage Flow

**Developer wants code review agent**:

1. Navigate to Agents folder (Segmented control → "Agents")
2. Click "+Agent" button
3. Enter name: `code-reviewer`
4. Enter description: "Review code for best practices and security"
5. Click "Generate with AI" → streams markdown in 10s
6. Review in editor, sees incomplete "Security" section
7. Click "Refine with AI"
8. Enter: "Expand the security section with examples of common vulnerabilities"
9. Streams refinement → security section expanded
10. Click "Save Agent"
11. File appears: `code-reviewer.md`
12. Deploy to projects with existing AgentDeployModal

**Time to complete**: ~1 minute

---

## Next Steps

1. Read [full implementation plan](./AGENT_CREATION_IMPLEMENTATION_PLAN.md)
2. Get Gemini API key from [Google AI Studio](https://ai.google.dev/)
3. Start with Phase 1 (Setup & Infrastructure)
4. Implement incrementally (test each phase)
5. Monitor costs with dashboard (track in Prisma)

---

## Questions?

Refer to sections in the full plan:
- [Architecture Overview](./AGENT_CREATION_IMPLEMENTATION_PLAN.md#architecture-overview) - Data flow diagrams
- [API Integration](./AGENT_CREATION_IMPLEMENTATION_PLAN.md#api-integration-strategy) - Complete API code
- [Security](./AGENT_CREATION_IMPLEMENTATION_PLAN.md#security-considerations) - All security measures
- [Testing](./AGENT_CREATION_IMPLEMENTATION_PLAN.md#testing-strategy) - Test examples
- [Appendix](./AGENT_CREATION_IMPLEMENTATION_PLAN.md#appendix) - Templates and examples

---

**Quick Start Version**: 1.0
**Last Updated**: 2025-10-11

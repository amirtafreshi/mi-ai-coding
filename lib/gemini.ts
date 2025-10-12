import { GoogleGenerativeAI } from '@google/generative-ai'

// Singleton instance
let genAI: GoogleGenerativeAI | null = null

/**
 * Get or create the Gemini AI client
 */
export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

/**
 * Agent creation system prompt template
 */
export const AGENT_SYSTEM_PROMPT = `You are an expert AI agent architect. Your task is to create comprehensive, production-ready agent definition files in Markdown format.

An agent definition should include:

1. **Frontmatter** (YAML):
   - name: Agent name
   - description: Brief description
   - version: Semantic version
   - tools: List of tools/capabilities

2. **Core Sections**:
   - ## Purpose: Clear mission statement
   - ## Capabilities: What the agent can do
   - ## Responsibilities: What the agent should handle
   - ## Workflow: Step-by-step implementation guide
   - ## Commands: Specific commands to execute
   - ## Integration: How to integrate with other systems
   - ## Logging: Activity logging examples
   - ## Best Practices: Guidelines and tips
   - ## Success Metrics: How to measure success

3. **Style Guidelines**:
   - Use clear, actionable language
   - Include code examples where relevant
   - Add concrete examples of commands
   - Provide error handling guidance
   - Include security considerations
   - Add links to documentation where helpful

Format the output as a complete Markdown document ready to be saved as a .md file.`

/**
 * Generate agent markdown from description
 */
export async function generateAgentMarkdown(
  name: string,
  description: string
): Promise<AsyncIterable<string>> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `${AGENT_SYSTEM_PROMPT}

Create an agent definition file for:

Name: ${name}
Description: ${description}

Generate a complete, production-ready agent definition in Markdown format.`

  const result = await model.generateContentStream(prompt)

  // Create async iterable for streaming
  return (async function* () {
    for await (const chunk of result.stream) {
      const text = chunk.text()
      yield text
    }
  })()
}

/**
 * Refine existing agent markdown with additional instructions
 */
export async function refineAgentMarkdown(
  existingMarkdown: string,
  refinementInstructions: string
): Promise<AsyncIterable<string>> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `${AGENT_SYSTEM_PROMPT}

Here is an existing agent definition:

\`\`\`markdown
${existingMarkdown}
\`\`\`

Please refine this agent definition based on the following instructions:
${refinementInstructions}

Generate the complete, improved agent definition in Markdown format.`

  const result = await model.generateContentStream(prompt)

  return (async function* () {
    for await (const chunk of result.stream) {
      const text = chunk.text()
      yield text
    }
  })()
}

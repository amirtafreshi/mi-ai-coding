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

/**
 * Skill creation system prompt template
 */
export const SKILL_SYSTEM_PROMPT = `You are an expert at creating Claude Code Skills. Skills are specialized modules that Claude loads dynamically when relevant to a task.

## SKILL.md Format Requirements

Skills use a specific format with YAML frontmatter:

\`\`\`markdown
---
name: skill-name-here
description: Clear description of what this skill does and when Claude should use it (max 200 chars)
---

# Skill Name Here

## Overview
Brief introduction to what this skill helps Claude accomplish.

## Instructions
Clear, step-by-step instructions for Claude to follow when using this skill.
Use progressive disclosure - start with essentials, then provide details.

## When to Use
Specific conditions or triggers that indicate this skill should be loaded.

## Examples
Concrete examples of using this skill effectively.

## Guidelines
- Best practices
- Common pitfalls to avoid
- Tips for optimal results

## Resources
List any resource files that support this skill (in resources/ folder):
- resources/examples.md - Example use cases
- resources/templates/ - Template files
- resources/reference.md - Reference documentation
\`\`\`

## Key Principles

1. **Progressive Disclosure**: Claude first sees only the name and description. The full SKILL.md is loaded only when relevant.
2. **Clear Descriptions**: The description field determines when Claude loads the skill - make it specific and actionable.
3. **Actionable Instructions**: Provide clear, step-by-step guidance that Claude can follow.
4. **Resource Support**: Skills can include reference files, templates, and examples in a resources/ folder.

## CRITICAL: YAML Frontmatter Requirements

The skill MUST start with YAML frontmatter in this EXACT format:

\`\`\`
---
name: skill-name-here
description: Description here (max 200 characters)
---
\`\`\`

- Name MUST be lowercase with hyphens (e.g., "my-skill-name")
- Description MUST be 200 characters or less
- Both fields are REQUIRED
- The frontmatter MUST start on line 1 with "---"
- The frontmatter MUST end with "---" on its own line

Format the output as a complete Markdown document ready to be saved as SKILL.md.`

/**
 * Generate skill markdown from description
 */
export async function generateSkillMarkdown(
  name: string,
  description: string
): Promise<AsyncIterable<string>> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  // Sanitize skill name
  const skillName = name.toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  // Truncate description if too long
  const skillDescription = description.length > 200
    ? description.substring(0, 197) + '...'
    : description

  const prompt = `${SKILL_SYSTEM_PROMPT}

Create a Claude Code Skill with the following requirements:

**Skill Name**: ${name}
**Sanitized Skill Name** (for YAML): ${skillName}
**Purpose**: ${description}

IMPORTANT REQUIREMENTS:
1. Start the skill with YAML frontmatter using the sanitized name: "${skillName}"
2. Use this exact description in the YAML (${skillDescription.length} chars): "${skillDescription}"
3. Ensure the YAML frontmatter is properly formatted with "---" delimiters
4. The first line MUST be "---"
5. Include both "name: ${skillName}" and "description: ${skillDescription}"
6. DO NOT wrap the output in markdown code blocks - output ONLY the skill content starting with "---"

Generate the complete SKILL.md file now.`

  const result = await model.generateContentStream(prompt)

  return (async function* () {
    for await (const chunk of result.stream) {
      const text = chunk.text()
      yield text
    }
  })()
}

/**
 * Refine existing skill markdown with additional instructions
 */
export async function refineSkillMarkdown(
  existingMarkdown: string,
  refinementInstructions: string
): Promise<AsyncIterable<string>> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `${SKILL_SYSTEM_PROMPT}

Here is an existing skill definition:

\`\`\`markdown
${existingMarkdown}
\`\`\`

Please refine this skill definition based on the following instructions:
${refinementInstructions}

IMPORTANT: Maintain the YAML frontmatter format and ensure:
1. The skill still starts with "---" on line 1
2. Both "name" and "description" fields are present
3. Description is 200 characters or less
4. The frontmatter ends with "---" before the markdown content

Generate the complete, improved skill definition in Markdown format.`

  const result = await model.generateContentStream(prompt)

  return (async function* () {
    for await (const chunk of result.stream) {
      const text = chunk.text()
      yield text
    }
  })()
}

/**
 * Generic document refinement for any file type
 * Detects file type and applies appropriate refinement strategy
 */
export async function refineDocument(
  content: string,
  refinementInstructions: string,
  fileType: 'agent' | 'skill' | 'file',
  fileName?: string
): Promise<AsyncIterable<string>> {
  // Route to specialized refinement functions for agents and skills
  if (fileType === 'agent') {
    return refineAgentMarkdown(content, refinementInstructions)
  } else if (fileType === 'skill') {
    return refineSkillMarkdown(content, refinementInstructions)
  }

  // Generic file refinement
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  // Detect language/file type from extension
  const extension = fileName?.split('.').pop()?.toLowerCase() || 'txt'
  const languageHints: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TypeScript React (TSX)',
    js: 'JavaScript',
    jsx: 'JavaScript React (JSX)',
    json: 'JSON',
    md: 'Markdown',
    py: 'Python',
    css: 'CSS',
    scss: 'SCSS',
    html: 'HTML',
    yaml: 'YAML',
    yml: 'YAML',
  }
  const language = languageHints[extension] || 'text'

  const prompt = `You are an expert code and document reviewer. Your task is to refine and improve the following ${language} document.

Here is the current content:

\`\`\`${extension}
${content}
\`\`\`

Please refine this document based on the following instructions:
${refinementInstructions}

Guidelines:
- Maintain the file's original purpose and structure
- Apply ${language}-specific best practices and formatting
- Improve code quality, readability, and maintainability
- Fix any obvious errors or issues
- Add helpful comments where appropriate
- Preserve all existing functionality

Generate the complete, improved ${language} document.`

  const result = await model.generateContentStream(prompt)

  return (async function* () {
    for await (const chunk of result.stream) {
      const text = chunk.text()
      yield text
    }
  })()
}


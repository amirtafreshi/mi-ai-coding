import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      )
    }

    // Claude Code Skills-specific prompt
    const prompt = `You are an expert at creating Claude Code Skills. Skills are specialized modules that Claude loads dynamically when relevant to a task.

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

## Examples of Good Skills

- **document-analyzer**: Analyzes and summarizes markdown, PDF, and Word documents
- **code-reviewer**: Reviews code for best practices, bugs, and improvements
- **test-generator**: Generates comprehensive test cases for code functions
- **mcp-builder**: Guides creation of Model Context Protocol servers
- **webapp-testing**: Creates Playwright tests for web applications

## Your Task

Create a Claude Code Skill with the following requirements:

**Skill Name**: ${name}
**Purpose**: ${description}

Generate a complete SKILL.md file that:
1. Uses proper YAML frontmatter with name and description (description max 200 chars)
2. Provides clear, actionable instructions for Claude
3. Explains when this skill should be used
4. Includes concrete examples
5. Suggests useful resource files (if applicable)

**Important**:
- Keep the description field under 200 characters
- Make the name lowercase with hyphens (e.g., "my-skill-name")
- Focus on what Claude should DO, not just what it should know
- Use progressive disclosure - start simple, add depth as needed

Generate the complete SKILL.md file now:`

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const generatedContent = result.response.text()

    return NextResponse.json({
      success: true,
      content: generatedContent
    })
  } catch (error: any) {
    console.error('Error generating skill:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate skill' },
      { status: 500 }
    )
  }
}

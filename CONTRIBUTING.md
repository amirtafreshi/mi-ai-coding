# Contributing to MI AI Coding Platform

Thank you for your interest in contributing to the MI AI Coding Platform! This document provides guidelines and instructions for contributing to the project.

**Last Updated**: 2025-10-12

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Style Guide](#code-style-guide)
4. [Testing Requirements](#testing-requirements)
5. [Commit Message Conventions](#commit-message-conventions)
6. [Pull Request Process](#pull-request-process)
7. [Agent System](#agent-system)
8. [Documentation](#documentation)

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. Read [INSTALL.md](INSTALL.md) and set up the development environment
2. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) to understand the system design
3. Reviewed [PROGRESS.md](PROGRESS.md) to see current project status
4. Checked existing issues and pull requests to avoid duplication

### Setting Up Your Development Environment

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/mi-ai-coding.git
cd mi-ai-coding

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/mi-ai-coding.git

# 4. Install dependencies
npm install

# 5. Set up environment variables
cp .env.example .env
# Edit .env with your local database credentials

# 6. Initialize database
npm run db:generate
npm run db:push

# 7. Start VNC servers (if working on VNC features)
./scripts/start-vnc.sh

# 8. Start development server
npm run dev
```

### First Contribution

Good first issues are tagged with `good-first-issue` label. These are typically:
- Documentation improvements
- Small bug fixes
- Code style improvements
- Test additions

---

## Development Workflow

### Branch Strategy

We use a feature branch workflow:

```bash
# 1. Create a feature branch from main
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# 2. Make your changes
# (commit often with meaningful messages)

# 3. Keep your branch updated
git fetch upstream
git rebase upstream/main

# 4. Push to your fork
git push origin feature/your-feature-name

# 5. Open a pull request
```

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `test/description` - Test additions or improvements
- `refactor/description` - Code refactoring
- `chore/description` - Build/tooling changes

**Examples**:
- `feature/add-file-search`
- `fix/monaco-editor-crash`
- `docs/update-api-reference`
- `test/add-e2e-tests`

---

## Code Style Guide

### TypeScript/JavaScript

We use ESLint and Prettier for code formatting. Configuration is in `.eslintrc.json` and `.prettierrc`.

**Key Guidelines**:

1. **Type Safety**: Always use TypeScript types, avoid `any`
   ```typescript
   // Good
   function processFile(file: File): Promise<string> { }

   // Bad
   function processFile(file: any): any { }
   ```

2. **Async/Await**: Prefer async/await over promises
   ```typescript
   // Good
   async function fetchData() {
     const result = await api.get('/data')
     return result
   }

   // Avoid
   function fetchData() {
     return api.get('/data').then(result => result)
   }
   ```

3. **Error Handling**: Always handle errors
   ```typescript
   try {
     await riskyOperation()
   } catch (error) {
     console.error('Operation failed:', error)
     throw new Error('User-friendly error message')
   }
   ```

4. **Import Order**: Use the following order
   ```typescript
   // 1. External libraries
   import { useState } from 'react'
   import { Button } from 'antd'

   // 2. Internal absolute imports (@/)
   import { prisma } from '@/lib/prisma'

   // 3. Relative imports
   import { helper } from './utils'
   ```

5. **Function Documentation**: Add JSDoc comments for complex functions
   ```typescript
   /**
    * Fetches file content from the database
    * @param filePath - Absolute path to the file
    * @returns Promise resolving to file content
    * @throws {NotFoundError} If file doesn't exist
    */
   async function getFileContent(filePath: string): Promise<string> {
     // Implementation
   }
   ```

### React Components

1. **Functional Components**: Always use functional components with hooks
2. **Component Structure**:
   ```typescript
   'use client' // Only if using client-side features

   import { useState } from 'react'

   interface MyComponentProps {
     title: string
     onSave: (data: string) => void
   }

   export default function MyComponent({ title, onSave }: MyComponentProps) {
     const [value, setValue] = useState('')

     // Event handlers
     const handleSubmit = () => {
       onSave(value)
     }

     // Render
     return (
       <div>
         <h1>{title}</h1>
         <button onClick={handleSubmit}>Save</button>
       </div>
     )
   }
   ```

3. **Hooks Rules**:
   - Call hooks at the top level (not in conditionals)
   - Use `useCallback` for functions passed as props
   - Use `useMemo` for expensive calculations
   - Use `useEffect` for side effects

### CSS/Styling

1. **Tailwind First**: Use Tailwind CSS utility classes
2. **Ant Design Components**: Use for UI elements (buttons, forms, modals)
3. **Custom Styles**: Only when Tailwind/Ant Design insufficient

```tsx
// Good - Tailwind utilities
<div className="flex items-center justify-between p-4 bg-gray-100">

// Good - Ant Design component
<Button type="primary" onClick={handleClick}>Submit</Button>

// Avoid - Inline styles unless dynamic
<div style={{ padding: '16px' }}>
```

### API Routes

Next.js 15 App Router pattern:

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const data = await prisma.model.findUnique({ where: { id } })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate with Zod
    const validated = schema.parse(body)

    // Process request
    const result = await prisma.model.create({ data: validated })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Bad request' },
      { status: 400 }
    )
  }
}
```

### Database (Prisma)

1. **Always use Prisma client from `@/lib/prisma`** (singleton pattern)
2. **Run migrations**: Use `npx prisma migrate dev` for schema changes
3. **Generate client**: Run `npx prisma generate` after schema changes
4. **Seed data**: Use `prisma/seed.ts` for test data

```typescript
import { prisma } from '@/lib/prisma'

// Good - Use transactions for multiple operations
async function transferData() {
  await prisma.$transaction([
    prisma.source.delete({ where: { id: 1 } }),
    prisma.destination.create({ data: { ... } })
  ])
}

// Good - Handle errors
try {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    throw new Error('User not found')
  }
} catch (error) {
  console.error('Database error:', error)
  throw error
}
```

---

## Testing Requirements

### Test Types

1. **E2E Tests (Playwright)**: Required for user-facing features
2. **Unit Tests**: For complex business logic
3. **Integration Tests**: For API endpoints

### Running Tests

```bash
# Run all tests on DISPLAY=:99 (visible in VNC)
npm test

# Run specific test file
DISPLAY=:99 npx playwright test tests/e2e/login.spec.ts

# Run with UI mode (debugging)
npm run test:ui

# Run with headed browser (watch tests execute)
npm run test:headed
```

### Writing Tests

**E2E Test Example**:
```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test'

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')

    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible()

    // Interact with elements
    await page.click('button#submit')

    // Assert results
    await expect(page.locator('.success-message')).toBeVisible()
  })
})
```

### Test Coverage Requirements

- All new features must include E2E tests
- Bug fixes should include regression tests
- API endpoints must have integration tests
- Critical paths require comprehensive test coverage

---

## Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature change)
- `test`: Adding or updating tests
- `chore`: Build process, tooling, dependencies
- `perf`: Performance improvements
- `ci`: CI/CD configuration changes

### Examples

```bash
# Feature
feat(file-explorer): add file search functionality

# Bug fix
fix(monaco-editor): prevent crash on empty file

# Documentation
docs(api): update endpoint documentation

# Breaking change
feat(auth)!: migrate to NextAuth v5

BREAKING CHANGE: NextAuth v5 requires new configuration format
```

### Rules

1. **Subject line**:
   - Use imperative mood ("add" not "added")
   - No period at the end
   - Maximum 72 characters

2. **Body** (optional):
   - Explain what and why, not how
   - Wrap at 72 characters

3. **Footer** (optional):
   - Reference issues: `Closes #123` or `Fixes #456`
   - Note breaking changes: `BREAKING CHANGE: description`

---

## Pull Request Process

### Before Opening a PR

1. **Update your branch** with latest `main`:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

3. **Update documentation** if needed
4. **Update PROGRESS.md** if completing a task

### Opening a Pull Request

1. **Title**: Follow commit message convention
   ```
   feat(component): add new feature
   ```

2. **Description**: Use the PR template
   ```markdown
   ## Description
   Brief description of changes

   ## Changes
   - Added feature X
   - Fixed bug Y
   - Updated documentation Z

   ## Testing
   - [ ] E2E tests pass
   - [ ] Manual testing completed
   - [ ] Screenshots attached (if UI change)

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] PROGRESS.md updated (if applicable)

   Closes #issue-number
   ```

3. **Screenshots**: Include for UI changes
4. **Link issues**: Reference related issues

### PR Review Process

1. **Automated checks**: All CI/CD checks must pass
2. **Code review**: At least one approval required
3. **Testing**: Reviewers may test locally
4. **Feedback**: Address all review comments
5. **Merge**: Squash and merge (maintainers only)

### After Merge

1. Delete your feature branch
2. Pull latest `main`
3. Celebrate your contribution!

---

## Agent System

This project uses a multi-agent development system. If you're working on agent-related features:

### Agent Types

1. **Orchestrating** - Coordinates all agents
2. **Full-Stack Developer** - Implements features
3. **Frontend Testing** - Runs E2E tests
4. **Debugging** - Investigates errors
5. **Documentation** - Updates docs
6. **GitHub Manager** - Manages releases
7. **Ubuntu System Admin** - Server configuration

### Agent Communication

Agents communicate via:
- **ActivityLog database**: Real-time logging
- **PROGRESS.md**: Status updates
- **WebSocket broadcasts**: Live updates to UI

### Contributing to Agent System

See `agents/*/README.md` for agent-specific guidelines.

---

## Documentation

### When to Update Documentation

- **Always**: When adding new features or changing APIs
- **PROGRESS.md**: After completing tasks
- **README.md**: For user-facing changes
- **docs/ARCHITECTURE.md**: For architectural changes
- **CLAUDE.md**: For development workflow changes

### Documentation Style

1. **Clear headings**: Use ATX-style headers (`#`)
2. **Code blocks**: Always specify language
3. **Examples**: Include practical examples
4. **Cross-reference**: Link to related docs
5. **Keep updated**: Update last modified date

### JSDoc Comments

Add JSDoc comments for:
- Public functions
- Complex logic
- API endpoints
- Exported utilities

```typescript
/**
 * Processes file upload and saves to database
 *
 * @param file - The file to upload
 * @param userId - ID of the user uploading
 * @returns Promise resolving to uploaded file record
 * @throws {ValidationError} If file type not supported
 * @throws {StorageError} If save fails
 *
 * @example
 * ```typescript
 * const result = await processUpload(file, user.id)
 * console.log(`File saved: ${result.path}`)
 * ```
 */
async function processUpload(
  file: File,
  userId: string
): Promise<FileRecord> {
  // Implementation
}
```

---

## Questions or Help?

- **Issues**: Open an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check `docs/` directory
- **Progress**: Review `PROGRESS.md` for project status

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow
- Follow project guidelines

---

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

**Thank you for contributing to MI AI Coding Platform!**

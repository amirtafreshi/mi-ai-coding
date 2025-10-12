/**
 * Test User Fixtures
 *
 * Defines test users for E2E testing
 * These users should match the seeded data in the database
 */

export const testUsers = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  user: {
    email: 'test@example.com',
    password: 'password123',
    role: 'user'
  },
  developer: {
    email: 'dev@example.com',
    password: 'dev123',
    role: 'developer'
  }
}

export const testFiles = {
  sampleText: {
    name: 'sample.txt',
    content: 'This is a sample text file for testing.',
    mimeType: 'text/plain'
  },
  sampleJs: {
    name: 'sample.js',
    content: 'console.log("Hello from test file");',
    mimeType: 'application/javascript'
  },
  sampleJson: {
    name: 'config.json',
    content: JSON.stringify({ test: true, environment: 'e2e' }, null, 2),
    mimeType: 'application/json'
  }
}

export const testFolders = {
  root: {
    name: 'test-project',
    path: '/test-project'
  },
  src: {
    name: 'src',
    path: '/test-project/src'
  },
  components: {
    name: 'components',
    path: '/test-project/src/components'
  }
}

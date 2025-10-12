/**
 * Prisma Client Singleton
 *
 * This module exports a singleton instance of PrismaClient to prevent
 * multiple instances in development (which causes connection pool issues).
 *
 * Pattern explained:
 * - In production: Creates one instance and uses it
 * - In development: Stores instance on globalThis to survive hot-reloads
 *
 * Why singleton pattern?
 * - Prevents "Too many connections" errors during development hot-reloads
 * - Ensures connection pool is shared across all modules
 * - Improves performance by reusing database connections
 *
 * Logging configuration:
 * - Development: Logs all queries, errors, and warnings for debugging
 * - Production: Only logs errors to reduce noise
 *
 * Usage:
 *   import { prisma } from '@/lib/prisma'
 *
 *   const users = await prisma.user.findMany()
 *   const file = await prisma.file.create({ data: { ... } })
 *
 * @module lib/prisma
 */

import { PrismaClient } from '@prisma/client'

/**
 * Extended global type to include Prisma client
 * Allows storing Prisma instance on globalThis in development
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Singleton Prisma client instance
 *
 * Reuses existing instance from globalThis in development to prevent
 * multiple instances during hot-reloads. Creates new instance in production.
 *
 * @type {PrismaClient}
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

/**
 * Store Prisma instance on globalThis in development
 * This prevents creating new instances during Next.js hot-reloads
 */
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

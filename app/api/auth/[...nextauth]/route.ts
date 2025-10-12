import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Create NextAuth handler with auth options
const handler = NextAuth(authOptions)

// Export as GET and POST handlers for Next.js 15 App Router
export { handler as GET, handler as POST }

/**
 * NextAuth Configuration and Authentication Utilities
 *
 * This module configures NextAuth v4 for the application's authentication system.
 * It uses a credentials-based provider with email/password authentication,
 * JWT sessions, and database integration via Prisma.
 *
 * Features:
 * - Email/password authentication with bcrypt password hashing
 * - JWT-based sessions with 30-day expiration
 * - Session token tracking in database for invalidation
 * - Activity logging for sign-in and sign-out events
 * - Custom pages for sign-in and errors
 * - Role-based access control (admin/user)
 *
 * Authentication Flow:
 * 1. User submits email/password on /login
 * 2. Credentials provider validates against database
 * 3. Password verified with bcrypt.compare()
 * 4. JWT token generated with user info and unique session token
 * 5. Session token stored in database (User.currentSessionToken)
 * 6. Activity log entry created for sign-in
 * 7. User redirected to /dashboard
 *
 * Session Management:
 * - JWT tokens are stateless but include unique sessionToken
 * - sessionToken stored in database for each login
 * - On logout, sessionToken cleared from database
 * - Old JWT tokens with mismatched sessionToken are invalid
 *
 * Usage:
 *   import { authOptions } from '@/lib/auth'
 *   import { getServerSession } from 'next-auth/next'
 *
 *   const session = await getServerSession(authOptions)
 *
 * @module lib/auth
 */

import { NextAuthOptions, Session, User } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

/**
 * NextAuth configuration options
 *
 * Configures authentication providers, session strategy, callbacks,
 * and event handlers for the authentication system.
 *
 * @type {NextAuthOptions}
 */
export const authOptions: NextAuthOptions = {
  /**
   * Authentication providers
   *
   * Currently uses Credentials provider for email/password authentication.
   * Can be extended with OAuth providers (Google, GitHub, etc.) if needed.
   */
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      /**
       * Authorize function - validates credentials and returns user
       *
       * Steps:
       * 1. Validates that email and password are provided
       * 2. Queries database for user by email
       * 3. Verifies password using bcrypt
       * 4. Returns user object (without password) on success
       *
       * @param {Object} credentials - User credentials
       * @param {string} credentials.email - User email
       * @param {string} credentials.password - User password (plaintext)
       * @returns {Promise<User>} User object without password
       * @throws {Error} If validation or authentication fails
       */
      async authorize(credentials) {
        // Validate credentials exist
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          // Find user in database
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          // Check if user exists
          if (!user) {
            throw new Error('Invalid email or password')
          }

          // Verify password using bcrypt
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            throw new Error('Invalid email or password')
          }

          // Return user object (without password for security)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          throw new Error('Authentication failed')
        }
      }
    })
  ],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  /**
   * Callbacks for customizing authentication behavior
   *
   * These callbacks allow modifying JWT tokens and sessions,
   * and controlling redirect behavior after authentication.
   */
  callbacks: {
    /**
     * JWT callback - called whenever a JWT token is created or updated
     *
     * On sign-in (when user exists):
     * - Adds user info to JWT token
     * - Generates unique session token
     * - Stores session token in database
     * - Updates user's lastLoginTime
     *
     * @param {Object} params - Callback parameters
     * @param {JWT} params.token - The JWT token
     * @param {User} [params.user] - User object (only on sign-in)
     * @returns {Promise<JWT>} Updated JWT token
     */
    async jwt({ token, user }: { token: JWT; user?: User }) {
      // Add user info to JWT token on sign in
      if (user) {
        const loginTime = Date.now()
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role
        token.loginTime = loginTime

        // Generate unique session token for this login
        const sessionToken = `${user.id}-${loginTime}-${Math.random().toString(36)}`
        token.sessionToken = sessionToken

        // Update user's current session token and last login time in database
        // This will invalidate any previous sessions
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              currentSessionToken: sessionToken,
              lastLoginTime: new Date(loginTime)
            }
          })
          console.log(`[Auth] New session created for user ${user.email} at ${new Date(loginTime).toISOString()}`)
        } catch (error) {
          console.error('Failed to update session token:', error)
        }
      }

      return token
    },

    /**
     * Session callback - called whenever session is accessed
     *
     * Adds user info from JWT token to the session object that's
     * returned to the client and API routes.
     *
     * @param {Object} params - Callback parameters
     * @param {Session} params.session - The session object
     * @param {JWT} params.token - The JWT token
     * @returns {Promise<Session>} Updated session object
     */
    async session({ session, token }: { session: Session; token: JWT }) {
      // Add user info from JWT to session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
        ;(session.user as any).role = token.role
        ;(session.user as any).sessionToken = token.sessionToken
        ;(session.user as any).loginTime = token.loginTime
      }
      return session
    },

    /**
     * Redirect callback - controls where users are redirected after authentication
     *
     * Default behavior:
     * - Redirects to /dashboard after successful login
     * - Preserves relative URLs
     * - Validates URLs are on same origin for security
     *
     * @param {Object} params - Callback parameters
     * @param {string} params.url - The URL to redirect to
     * @param {string} params.baseUrl - The base URL of the application
     * @returns {Promise<string>} The URL to redirect to
     */
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after login
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      } else if (new URL(url).origin === baseUrl) {
        return url
      }
      return baseUrl + '/dashboard'
    }
  },

  /**
   * Event handlers for authentication lifecycle events
   *
   * These handlers are called for side effects (logging, analytics, etc.)
   * and don't affect the authentication flow.
   */
  events: {
    /**
     * Sign-in event handler
     *
     * Creates an activity log entry when a user successfully signs in.
     * Used for audit trails and security monitoring.
     *
     * @param {Object} params - Event parameters
     * @param {User} params.user - The authenticated user
     * @param {Object} params.account - Account information
     * @param {Object} params.profile - User profile
     * @param {boolean} params.isNewUser - Whether this is a new user
     */
    async signIn({ user, account, profile, isNewUser }) {
      // Log successful sign in
      try {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            agent: 'auth-system',
            action: 'user_login',
            details: `User ${user.email} signed in successfully`,
            level: 'info',
          }
        })
      } catch (error) {
        console.error('Failed to log sign-in activity:', error)
      }
    },
    /**
     * Sign-out event handler
     *
     * Clears the session token from database and creates activity log entry.
     * This invalidates the session and prevents reuse of old JWT tokens.
     *
     * @param {Object} params - Event parameters
     * @param {JWT} params.token - The JWT token
     * @param {Session} params.session - The session object
     */
    async signOut({ token, session }) {
      // Clear session token from database and log sign out
      try {
        if (token?.id) {
          // Clear current session token
          await prisma.user.update({
            where: { id: token.id as string },
            data: { currentSessionToken: null }
          })

          // Log sign out activity
          if (token?.email) {
            await prisma.activityLog.create({
              data: {
                userId: token.id as string,
                agent: 'auth-system',
                action: 'user_logout',
                details: `User ${token.email} signed out`,
                level: 'info',
              }
            })
          }
        }
      } catch (error) {
        console.error('Failed to handle sign-out:', error)
      }
    }
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
}

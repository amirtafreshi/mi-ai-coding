import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  /**
   * Extends the built-in session types to include custom fields
   */
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }

  /**
   * Extends the built-in user types to include custom fields
   */
  interface User {
    role: string
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extends the built-in JWT types to include custom fields
   */
  interface JWT {
    id: string
    role: string
  }
}

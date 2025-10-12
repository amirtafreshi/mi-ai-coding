import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Middleware to protect dashboard routes
export default withAuth(
  function middleware(req) {
    // Allow unauthenticated POST requests to activity API (for agent logging)
    if (req.nextUrl.pathname === '/api/activity' && req.method === 'POST') {
      return NextResponse.next()
    }

    // Allow request to continue if authenticated
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow unauthenticated POST requests to activity API (for agent logging)
        if (req.nextUrl.pathname === '/api/activity' && req.method === 'POST') {
          return true
        }

        // Only allow access if user has a valid token
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

// Protect all dashboard routes
// Note: /api/activity is excluded to allow unauthenticated POST for agent logging
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/files/:path*',
    '/api/vnc/:path*',
  ]
}

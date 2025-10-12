import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Helper to convert empty strings to undefined for optional validation
const optionalString = <T extends z.ZodString>(schema: T) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    schema.optional()
  )

// Validation schema for user update
const updateUserSchema = z.object({
  email: optionalString(z.string().email('Invalid email address')),
  name: optionalString(z.string().min(1, 'Name is required')),
  password: optionalString(z.string().min(6, 'Password must be at least 6 characters')),
  role: z.enum(['admin', 'user', 'viewer', 'developer']).optional(),
})

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (currentUser?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const params = await context.params
    const userId = params.id

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('[API PUT /api/users/:id] Received body:', body)

    const validation = updateUserSchema.safeParse(body)
    console.log('[API PUT /api/users/:id] Validation result:', { success: validation.success, error: validation.error?.issues })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { email, name, password, role } = validation.data

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (email) updateData.email = email
    if (name) updateData.name = name
    if (role) updateData.role = role
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Build details string for activity log
    const changes = []
    if (email) changes.push(`email to ${email}`)
    if (name) changes.push(`name to ${name}`)
    if (role) changes.push(`role to ${role}`)
    if (password) changes.push('password')

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        agent: 'user-management',
        action: 'update_user',
        details: `Admin ${currentUser.email} updated user ${existingUser.email}: ${changes.join(', ')}`,
        level: 'info',
      },
    })

    return NextResponse.json({
      user: updatedUser,
      message: 'User updated successfully',
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (currentUser?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const params = await context.params
    const userId = params.id

    // Prevent admin from deleting themselves
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user (cascade will handle sessions and activity logs)
    await prisma.user.delete({
      where: { id: userId },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        agent: 'user-management',
        action: 'delete_user',
        details: `Admin ${currentUser.email} deleted user: ${existingUser.email} (${existingUser.role})`,
        level: 'warning',
      },
    })

    return NextResponse.json({
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

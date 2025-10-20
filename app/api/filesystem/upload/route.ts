import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, access, constants } from 'fs/promises'
import { join, basename } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const targetPath = formData.get('targetPath') as string

    if (!targetPath) {
      return NextResponse.json({ error: 'targetPath is required' }, { status: 400 })
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Ensure target directory exists
    await mkdir(targetPath, { recursive: true })

    const uploadedFiles: string[] = []
    const failedFiles: { name: string; error: string }[] = []

    for (const file of files) {
      try {
        const fileName = basename(file.name)
        const filePath = join(targetPath, fileName)

        // Check if file exists
        let fileExists = false
        try {
          await access(filePath, constants.F_OK)
          fileExists = true
        } catch {
          // File doesn't exist, which is fine
        }

        // Read file as buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Write file
        await writeFile(filePath, buffer)

        // Set permissions (644 for files)
        // Note: chmod is handled by the filesystem automatically with umask
        // If specific permissions are needed, use: await chmod(filePath, 0o644)

        uploadedFiles.push(fileName)

        console.log(`[API /api/filesystem/upload] Uploaded: ${filePath} (${buffer.length} bytes)${fileExists ? ' [overwritten]' : ''}`)
      } catch (error: any) {
        console.error(`[API /api/filesystem/upload] Failed to upload ${file.name}:`, error)
        failedFiles.push({ name: file.name, error: error.message })
      }
    }

    const response: any = {
      success: true,
      uploaded: uploadedFiles,
      uploadedCount: uploadedFiles.length,
      targetPath,
    }

    if (failedFiles.length > 0) {
      response.failed = failedFiles
      response.failedCount = failedFiles.length
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[API /api/filesystem/upload] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload files' },
      { status: 500 }
    )
  }
}

import { db } from '@/lib/db'
import { files } from '@/lib/db/schema'
import { auth } from '@clerk/nextjs/server'
import { eq, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, parentId = null, userId: bodyUserId } = body

    if (bodyUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid folder name' },
        { status: 400 }
      )
    }

    if (parentId) {
      const [parentFolder] = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, parentId),
            eq(files.userId, userId),
            eq(files.isFolder, true)
          )
        )
        .limit(1)
      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 404 }
        )
      }
    }

    // create folder in the database
    const folderData = {
      id: crypto.randomUUID(),
      name: name.trim(),
      path: `/folders/${userId}/${crypto.randomUUID()}`,
      size: 0,
      type: 'folder',
      fileUrl: '',
      thumbnailUrl: null,
      userId: userId,
      isFolder: true,
      parentId: parentId,
      isStarred: false,
      isTrash: false,
    }

    const [newFolder] = await db.insert(files).values(folderData).returning()

    return NextResponse.json({
      folder: newFolder,
      success: true,
      message: 'Folder created successfully',
    })
  } catch (error) {
    console.log('[FOLDER_CREATE_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}

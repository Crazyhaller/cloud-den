import { db } from '@/lib/db'
import { files } from '@/lib/db/schema'
import { auth } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'
import ImageKit from 'imagekit'
import { NextRequest, NextResponse } from 'next/server'

// ImageKit Credentials
const imageKit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const formUserId = formData.get('userId') as string
    const parentId = formData.get('parentId') as string | null

    if (formUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
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

      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 404 }
        )
      }
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only Image and PDF files are allowed' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)

    const folderPath = parentId
      ? `/cloud-den/${userId}/folders/${parentId}`
      : `/cloud-den/${userId}`

    const fileExtension = file.name.split('.').pop() || ''

    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`

    const uploadResponse = await imageKit.upload({
      file: fileBuffer,
      fileName: uniqueFileName,
      folder: folderPath,
      useUniqueFileName: false,
    })

    const fileData = {
      name: file.name,
      path: uploadResponse.filePath,
      size: file.size,
      type: file.type,
      fileUrl: uploadResponse.url,
      thumbnailUrl: uploadResponse.thumbnailUrl || null,
      userId: userId,
      parentId: parentId || null,
      isFolder: false,
      isStarred: false,
      isTrash: false,
    }

    const [newFile] = await db.insert(files).values(fileData).returning()

    return NextResponse.json(newFile, { status: 201 })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

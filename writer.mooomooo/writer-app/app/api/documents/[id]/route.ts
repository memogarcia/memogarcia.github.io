import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { getDocument, uploadDocument } from '../../../../src/lib/minio';
import { cookies } from 'next/headers';

// GET /api/documents/[id] - Get document content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Simple session check
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token');
    
    // For development, auto-login
    let userId = sessionToken?.value;
    if (!userId && process.env.NODE_ENV === 'development') {
      let devUser = await prisma.user.findFirst({
        where: { email: 'dev@writer.mooomooo' }
      });
      if (!devUser) {
        devUser = await prisma.user.create({
          data: {
            email: 'dev@writer.mooomooo',
            name: 'Development User',
          }
        });
      }
      userId = devUser.id;
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find document and verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Fetch content from MinIO
    const content = await getDocument(document.s3Key);
    const documentData = JSON.parse(content);

    return NextResponse.json({
      document: {
        ...document,
        content: documentData.paragraphs || documentData.content,
        fullData: documentData,
      },
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[id] - Update document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, metadata } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find document and verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get existing document data for versioning
    let existingData;
    try {
      const existingContent = await getDocument(document.s3Key);
      existingData = JSON.parse(existingContent);
    } catch {
      existingData = { version: 0 };
    }

    // Parse content if it's a string (JSON stringified paragraphs)
    let parsedContent = content;
    if (typeof content === 'string') {
      try {
        parsedContent = JSON.parse(content);
      } catch {
        // If not JSON, treat as plain text
        parsedContent = { paragraphs: [{ id: Date.now().toString(), content, isEditing: false }] };
      }
    }

    // Update document content in MinIO
    const updatedData = {
      title: title || existingData.title,
      ...(parsedContent || existingData),
      metadata: metadata || existingData.metadata,
      version: (existingData.version || 0) + 1,
      createdAt: existingData.createdAt || document.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await uploadDocument(
      document.s3Key,
      JSON.stringify(updatedData),
      { 'Content-Type': 'application/json' }
    );

    // Update metadata in PostgreSQL
    const wordCount = content ? content.split(/\s+/).length : document.wordCount;
    
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        title: title || document.title,
        wordCount,
        metadata: metadata || document.metadata,
      },
    });

    return NextResponse.json({ document: updatedDocument });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prisma';
import { uploadDocument, getDocument, deleteDocument } from '../../../src/lib/minio';
import { cookies } from 'next/headers';

// GET /api/documents - List all documents for user
export async function GET(request: NextRequest) {
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
      where: { id: userId },
      include: { documents: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ documents: user.documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Create new document
export async function POST(request: NextRequest) {
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

    const { title, content, metadata } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate unique S3 key
    const timestamp = Date.now();
    const s3Key = `${user.id}/${timestamp}-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;

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

    // Upload document content to MinIO
    const documentData = {
      title,
      ...parsedContent,
      metadata,
      version: 1,
      createdAt: new Date().toISOString(),
    };

    await uploadDocument(
      s3Key,
      JSON.stringify(documentData),
      { 'Content-Type': 'application/json' }
    );

    // Save document reference in PostgreSQL
    const wordCount = typeof content === 'string' 
      ? content.split(/\s+/).length 
      : JSON.stringify(parsedContent).split(/\s+/).length;
    
    const document = await prisma.document.create({
      data: {
        title,
        userId: user.id,
        s3Key,
        s3Bucket: 'writer.mooomooo',
        wordCount,
        metadata,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents - Delete document
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
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
        id: documentId,
        userId: user.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete from MinIO
    await deleteDocument(document.s3Key);

    // Delete from PostgreSQL
    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
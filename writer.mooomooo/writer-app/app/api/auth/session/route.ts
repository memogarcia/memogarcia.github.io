import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../src/lib/prisma';

// Simple session management
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token');
    
    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }
    
    // For development, create a default user if none exists
    if (process.env.NODE_ENV === 'development') {
      let user = await prisma.user.findFirst({
        where: { email: 'dev@writer.mooomooo' }
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'dev@writer.mooomooo',
            name: 'Development User',
          }
        });
      }
      
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      });
    }
    
    return NextResponse.json({ user: null });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}
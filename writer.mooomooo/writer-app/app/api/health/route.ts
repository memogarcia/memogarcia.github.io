import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // You can add more sophisticated health checks here
    // For example: database connectivity, external service health, etc.
    
    return NextResponse.json(
      { 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'writer-app'
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}

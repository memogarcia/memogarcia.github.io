# Backend Setup - PostgreSQL + MinIO

This document explains the new backend architecture using PostgreSQL for state management and MinIO for document storage.

## Architecture Overview

The Writer app now uses a hybrid storage approach:
- **PostgreSQL**: Stores document metadata, user information, sessions, and relationships
- **MinIO**: Stores actual document content as JSON files in S3-compatible object storage

This separation provides:
- Better scalability for large documents
- Efficient querying of metadata without loading full content
- Cost-effective storage for document content
- Easy backup and migration strategies

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- npm or yarn package manager

## Quick Start

### 1. Start the Infrastructure

```bash
# From the project root directory
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- MinIO on ports 9000 (API) and 9001 (Console)
- Caddy reverse proxy on port 80

### 2. Install Dependencies

```bash
cd writer-app
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env.local
```

Update `.env.local` with your settings:
```env
# Database
DATABASE_URL="postgresql://writer:writer_password@localhost:5432/writer_db"

# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minio_admin
MINIO_SECRET_KEY=minio_password123
MINIO_BUCKET=writer.mooomooo

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

### 5. Start the Application

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Service URLs

- **Application**: http://localhost:3000
- **MinIO Console**: http://localhost:9001
  - Username: `minio_admin`
  - Password: `minio_password123`
- **PostgreSQL**: localhost:5432
  - Database: `writer_db`
  - Username: `writer`
  - Password: `writer_password`

## API Endpoints

### Document Management

- `GET /api/documents` - List all documents for authenticated user
- `POST /api/documents` - Create new document
- `GET /api/documents/[id]` - Get document content
- `PUT /api/documents/[id]` - Update document
- `DELETE /api/documents?id=[id]` - Delete document

### Request/Response Examples

#### Create Document
```json
POST /api/documents
{
  "title": "My Document",
  "content": "Document content here...",
  "metadata": {
    "tags": ["writing", "essay"],
    "category": "personal"
  }
}
```

#### Response
```json
{
  "document": {
    "id": "clxxx...",
    "title": "My Document",
    "userId": "user-id",
    "s3Key": "user-id/timestamp-my-document.json",
    "s3Bucket": "writer.mooomooo",
    "wordCount": 150,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Database Schema

The PostgreSQL database stores:
- **Users**: User profiles and authentication
- **Documents**: Document metadata and S3 references
- **Sessions**: User sessions for authentication
- **Accounts**: OAuth provider accounts

## MinIO Storage Structure

Documents are stored in MinIO with the following structure:
```
writer.mooomooo/
├── user-id-1/
│   ├── timestamp-document-1.json
│   └── timestamp-document-2.json
└── user-id-2/
    └── timestamp-document-3.json
```

Each JSON file contains:
```json
{
  "title": "Document Title",
  "content": "Full document content...",
  "metadata": {},
  "version": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Development Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL container is running: `docker ps`
- Check DATABASE_URL in `.env` file
- Verify port 5432 is not already in use

### MinIO Connection Issues
- Check MinIO container status: `docker ps`
- Verify MinIO credentials in `.env` file
- Access MinIO console at http://localhost:9001

### Migration Issues
- Run `npx prisma generate` after schema changes
- Use `npx prisma migrate reset` for a clean slate
- Check PostgreSQL logs: `docker-compose logs db`

## Production Considerations

1. **Security**:
   - Change all default passwords
   - Use strong NEXTAUTH_SECRET
   - Enable SSL for MinIO
   - Set up proper CORS policies

2. **Backup**:
   - Regular PostgreSQL backups
   - MinIO bucket replication
   - Store backups in separate location

3. **Scaling**:
   - Use connection pooling for PostgreSQL
   - Consider MinIO cluster for high availability
   - Implement caching layer (Redis)

4. **Monitoring**:
   - Set up application monitoring
   - Monitor MinIO storage usage
   - Database performance metrics

## Next Steps

1. Implement authentication with NextAuth
2. Add document versioning
3. Implement real-time collaboration
4. Add full-text search with PostgreSQL
5. Set up backup automation
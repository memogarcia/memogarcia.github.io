import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minio_admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minio_password123',
});

export const BUCKET_NAME = process.env.MINIO_BUCKET || 'writer.mooomooo';

// Ensure bucket exists
export async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`Bucket ${BUCKET_NAME} created successfully`);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

// Upload document to MinIO
export async function uploadDocument(
  key: string,
  content: Buffer | string,
  metadata?: Record<string, string>
) {
  try {
    await ensureBucket();
    
    const buffer = typeof content === 'string' 
      ? Buffer.from(content, 'utf-8') 
      : content;
    
    await minioClient.putObject(
      BUCKET_NAME,
      key,
      buffer,
      buffer.length,
      metadata
    );
    
    return { bucket: BUCKET_NAME, key };
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

// Download document from MinIO
export async function getDocument(key: string): Promise<string> {
  try {
    const stream = await minioClient.getObject(BUCKET_NAME, key);
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
}

// Delete document from MinIO
export async function deleteDocument(key: string) {
  try {
    await minioClient.removeObject(BUCKET_NAME, key);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

// Generate a presigned URL for direct access
export async function getPresignedUrl(key: string, expiry = 24 * 60 * 60) {
  try {
    return await minioClient.presignedGetObject(BUCKET_NAME, key, expiry);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

export default minioClient;
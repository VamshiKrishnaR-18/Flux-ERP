import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { logger } from '../utils/logger';

interface UploadParams {
  file: Express.Multer.File;
  folder?: string;
}

export interface StorageProvider {
  upload(params: UploadParams): Promise<string>;
  delete(url: string): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
  async upload({ file, folder = 'uploads' }: UploadParams): Promise<string> {
    const uploadDir = path.join(process.cwd(), folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    
    fs.renameSync(file.path, filePath);
    
    return `/${folder}/${fileName}`;
  }

  async delete(url: string): Promise<void> {
    const filePath = path.join(process.cwd(), url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    this.bucket = process.env.AWS_S3_BUCKET || '';
  }

  async upload({ file, folder = 'uploads' }: UploadParams): Promise<string> {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: fileName,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype,
        ACL: 'public-read',
      },
    });

    await upload.done();
    
    // Return S3 URL
    return `https://${this.bucket}.s3.amazonaws.com/${fileName}`;
  }

  async delete(url: string): Promise<void> {
    const key = url.split('.com/')[1];
    if (!key) return;

    try {
      await this.client.send({
        // @ts-ignore
        command: 'DeleteObject',
        params: {
          Bucket: this.bucket,
          Key: key,
        },
      });
    } catch (error) {
      logger.error('Failed to delete from S3:', error);
    }
  }
}

export const StorageService = process.env.STORAGE_PROVIDER === 's3' 
  ? new S3StorageProvider() 
  : new LocalStorageProvider();

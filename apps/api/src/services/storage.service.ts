import fs from 'fs';
import path from 'path';
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

export const StorageService = new LocalStorageProvider();

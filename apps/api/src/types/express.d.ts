import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: { id: string; role: string } | JwtPayload;
      file?: Multer.File;
      files?: Multer.File[];
    }
  }
}
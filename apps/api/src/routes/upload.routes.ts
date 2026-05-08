import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler';
import { StorageService } from '../services/storage.service';

const router = Router();

// Configure multer for temporary storage
const upload = multer({ 
  dest: 'uploads/tmp/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post('/', upload.single('file') as any, asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const fileUrl = await StorageService.upload({ file: req.file });

  res.json({
    success: true,
    data: {
      name: req.file.originalname,
      url: fileUrl,
      type: req.file.mimetype,
      size: req.file.size
    }
  });
}) as any);

export default router;

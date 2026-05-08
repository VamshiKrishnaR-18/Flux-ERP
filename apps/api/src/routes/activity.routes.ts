import { Router } from 'express';
import { ActivityLogModel } from '../models/activity.model';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    ActivityLogModel.find({ userId })
      .sort({ at: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLogModel.countDocuments({ userId })
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

export default router;

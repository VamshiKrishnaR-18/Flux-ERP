import { Request, Response } from 'express';
import { SettingsModel } from '../models/settings.model';
import { SettingsSchema } from '@erp/types';
import { asyncHandler } from '../utils/asyncHandler'; // ✅ Import

export const SettingsController = {
  
  // GET Settings
  get: asyncHandler(async (req: Request, res: Response) => {
    let settings = await SettingsModel.findOne({ userId: req.user?.id });
    
    if (!settings) {
        return res.json({ success: true, data: {} });
    }
    
    res.json({ success: true, data: settings });
  }),

  // UPDATE Settings
  update: asyncHandler(async (req: Request, res: Response) => {
    const validation = SettingsSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400);
        throw new Error(validation.error.errors[0]?.message || "Invalid Settings Data");
    }

    const settings = await SettingsModel.findOneAndUpdate(
      { userId: req.user?.id },
      { 
          ...validation.data,
          userId: req.user?.id 
      }, 
      { new: true, upsert: true }
    );

    res.json({ success: true, message: "Settings saved", data: settings });
  })
};
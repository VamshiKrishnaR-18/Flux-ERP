import { Request, Response } from 'express';
import { SettingsModel } from '../models/settings.model';
import { SettingsSchema } from '@erp/types';

export const SettingsController = {
  
  // GET Settings
  get: async (req: Request, res: Response) => {
    try {
      // Find settings for this user
      let settings = await SettingsModel.findOne({ userId: req.user?.id });
      
      // If none exist, return empty default object (don't fail)
      if (!settings) {
          return res.json({ success: true, data: {} });
      }
      
      res.json({ success: true, data: settings });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch settings" });
    }
  },

  // UPDATE Settings
  update: async (req: Request, res: Response) => {
    const validation = SettingsSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ success: false, error: validation.error.errors });

    try {
      // Find and Update OR Create (Upsert)
      const settings = await SettingsModel.findOneAndUpdate(
        { userId: req.user?.id }, // Filter
        { 
            ...validation.data,
            userId: req.user?.id // Ensure ID is set on creation
        }, 
        { new: true, upsert: true } // Options
      );

      res.json({ success: true, message: "Settings saved", data: settings });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to save settings" });
    }
  }
};
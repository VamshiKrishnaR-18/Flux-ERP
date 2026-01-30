import { Request, Response } from 'express';
import { SettingsModel } from '../models/settings.model';

export const SettingsController = {
  // GET Settings (Create default if none exists)
  get: async (req: Request, res: Response) => {
    try {
      let settings = await SettingsModel.findOne();
      
      // If no settings exist yet, create default ones
      if (!settings) {
        settings = await SettingsModel.create({ companyName: 'Flux ERP Demo' });
      }

      res.json({ success: true, data: settings });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch settings" });
    }
  },

  // UPDATE Settings
  update: async (req: Request, res: Response) => {
    try {
      // Find the first document and update it (upsert: true creates it if missing)
      const settings = await SettingsModel.findOneAndUpdate(
        {}, 
        req.body, 
        { new: true, upsert: true }
      );
      
      res.json({ success: true, message: "Settings updated", data: settings });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update settings" });
    }
  }
};
import { Request, Response } from 'express';
import { ClientModel } from '../models/client.model';
import {ClientSchema as CreateClientSchema} from '@erp/types'; // Make sure this matches your types

export const ClientController = {
  
  getAll: async (req: Request, res: Response) => {
    try {
      // Return all clients that are NOT soft-deleted
      const clients = await ClientModel.find({ removed: { $ne: true } })
        .sort({ createdAt: -1 });
      res.json({ success: true, data: clients });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch clients" });
    }
  },

  create: async (req: Request, res: Response) => {
    const validation = CreateClientSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error.errors });
    }

    try {
      const newClient = await ClientModel.create(validation.data);
      res.status(201).json({ success: true, data: newClient });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create client" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const updatedClient = await ClientModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedClient) return res.status(404).json({ success: false, message: "Client not found" });
      res.json({ success: true, data: updatedClient });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update client" });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      // Soft delete
      await ClientModel.findByIdAndUpdate(req.params.id, { removed: true });
      res.json({ success: true, message: "Client deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete client" });
    }
  }
};
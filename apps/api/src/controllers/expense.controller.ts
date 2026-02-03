import { Request, Response } from 'express';
import { ExpenseModel } from '../models/expense.model';
import { ExpenseSchema } from '@erp/types';

export const ExpenseController = {
  
  getAll: async (req: Request, res: Response) => {
    try {
      const expenses = await ExpenseModel.find().sort({ date: -1 });
      res.json({ success: true, data: expenses });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch expenses" });
    }
  },

  create: async (req: Request, res: Response) => {
    // 🔍 Debug Log: See exactly what the frontend sent
    console.log("Incoming Expense Payload:", req.body);

    const validation = ExpenseSchema.safeParse(req.body);
    
    if (!validation.success) {
      console.error("❌ Validation Failed:", validation.error.errors);
      return res.status(400).json({ success: false, error: validation.error.errors });
    }

    try {
      const newExpense = await ExpenseModel.create({
        ...validation.data,
        // @ts-ignore - 'user' is added by authMiddleware
        createdBy: req.user?.id 
      });
      console.log("✅ Expense Saved:", newExpense._id);
      res.status(201).json({ success: true, message: "Expense recorded", data: newExpense });
    } catch (error) {
      console.error("❌ DB Error:", error);
      res.status(500).json({ success: false, message: "Failed to create expense" });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await ExpenseModel.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "Expense deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete expense" });
    }
  }
};
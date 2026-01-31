import { Request, Response } from 'express';
import { ExpenseModel } from '../models/expense.model';
import { ExpenseSchema } from '@erp/types';

export const ExpenseController = {
  // GET ALL
  getAll: async (req: Request, res: Response) => {
    try {
      const expenses = await ExpenseModel.find().sort({ date: -1 });
      res.json({ success: true, data: expenses });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch expenses" });
    }
  },

  // CREATE
  create: async (req: Request, res: Response) => {
    const validation = ExpenseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error.errors });
    }

    try {
      const newExpense = await ExpenseModel.create({
        ...validation.data,
        createdBy: req.user?.id
      });
      res.status(201).json({ success: true, message: "Expense recorded", data: newExpense });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create expense" });
    }
  },

  // DELETE
  delete: async (req: Request, res: Response) => {
    try {
      await ExpenseModel.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "Expense deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete expense" });
    }
  }
};
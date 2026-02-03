import { Request, Response } from 'express';
import { ExpenseModel } from '../models/expense.model';
import { ExpenseSchema } from '@erp/types';
import { asyncHandler } from '../utils/asyncHandler'; // ✅ Import

export const ExpenseController = {
  
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const expenses = await ExpenseModel.find().sort({ date: -1 });
    res.json({ success: true, data: expenses });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const validation = ExpenseSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400);
      throw new Error(validation.error.errors[0]?.message || "Invalid Input");
    }

    const newExpense = await ExpenseModel.create({
      ...validation.data,
      // @ts-ignore - 'user' is added by authMiddleware
      createdBy: req.user?.id 
    });
    
    res.status(201).json({ success: true, message: "Expense recorded", data: newExpense });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const expense = await ExpenseModel.findByIdAndDelete(req.params.id);
    if (!expense) {
        res.status(404);
        throw new Error("Expense not found");
    }
    res.json({ success: true, message: "Expense deleted" });
  })
};
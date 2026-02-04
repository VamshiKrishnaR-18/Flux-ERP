import { Request, Response } from 'express';
import { ExpenseModel } from '../models/expense.model';
import { ExpenseSchema } from '@erp/types';
import { asyncHandler } from '../utils/asyncHandler';

export const ExpenseController = {
  // ✅ UPDATED: Search + Pagination
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    const query: any = {};
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const expenses = await ExpenseModel.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ExpenseModel.countDocuments(query);

    res.json({ 
      success: true, 
      data: expenses,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const validation = ExpenseSchema.safeParse(req.body);
    if (!validation.success) { res.status(400); throw new Error("Invalid Input"); }
    const newExpense = await ExpenseModel.create({ ...validation.data, createdBy: req.user?.id });
    res.status(201).json({ success: true, message: "Expense recorded", data: newExpense });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await ExpenseModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Expense deleted" });
  })
};
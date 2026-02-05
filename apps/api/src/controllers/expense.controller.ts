import { Request, Response } from 'express';
import { ExpenseModel } from '../models/expense.model';
import { ExpenseSchema } from '../shared/types';
import { asyncHandler } from '../utils/asyncHandler';
import { buildCsv } from '../utils/csv';

export const ExpenseController = {
  // ✅ UPDATED: Search + Pagination
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    const query: any = { createdBy: req.user?.id };
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

  exportCsv: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const search = (req.query.search as string) || '';

    const query: any = { createdBy: userId };
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const expenses: any[] = await ExpenseModel.find(query)
      .sort({ date: -1 })
      .lean();

    const csv = buildCsv(expenses, [
      { header: 'Description', value: (e: any) => e.description ?? '' },
      { header: 'Amount', value: (e: any) => e.amount ?? '' },
      { header: 'Date', value: (e: any) => (e.date ? new Date(e.date).toISOString().slice(0, 10) : '') },
      { header: 'Category', value: (e: any) => e.category ?? '' },
      { header: 'Expense ID', value: (e: any) => e._id ?? '' }
    ]);

    const dateTag = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${dateTag}.csv"`);
    res.status(200).send(csv);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const validation = ExpenseSchema.safeParse(req.body);
    if (!validation.success) { res.status(400); throw new Error("Invalid Input"); }
    const newExpense = await ExpenseModel.create({ ...validation.data, createdBy: req.user?.id });
    res.status(201).json({ success: true, message: "Expense recorded", data: newExpense });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const deleted = await ExpenseModel.findOneAndDelete({ _id: req.params.id, createdBy: req.user?.id });
    if (!deleted) {
      res.status(404);
      throw new Error('Expense not found');
    }
    res.json({ success: true, message: "Expense deleted" });
  })
};
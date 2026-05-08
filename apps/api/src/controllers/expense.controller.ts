import { Request, Response } from 'express';
import { ExpenseModel } from '../models/expense.model';
import { ExpenseSchema } from '@erp/types';
import { asyncHandler } from '../utils/asyncHandler';
import { buildCsv } from '../utils/csv';
import { logActivity } from '../utils/activity';
import { sanitize } from '../utils/sanitize';

export const ExpenseController = {
  // Search + Pagination
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    const query: any = { createdBy: req.user?.id, removed: { $ne: true } };
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const [expenses, total] = await Promise.all([
      ExpenseModel.find(query).sort({ date: -1 }).skip(skip).limit(limit),
      ExpenseModel.countDocuments(query)
    ]);

    res.json({ 
      success: true, 
      data: expenses,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const expense = await ExpenseModel.findOne({ 
      _id: req.params.id, 
      createdBy: req.user?.id,
      removed: { $ne: true }
    });
    if (!expense) { res.status(404); throw new Error('Expense not found'); }
    res.json({ success: true, data: expense });
  }),

  exportCsv: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const search = (req.query.search as string) || '';

    const query: any = { createdBy: userId, removed: { $ne: true } };
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
    
    const sanitizedData = sanitize(validation.data);
    const newExpense = await ExpenseModel.create({ ...sanitizedData, createdBy: req.user?.id });
    
    await logActivity({
        userId: String(req.user?.id),
        action: 'created',
        resourceType: 'Expense',
        resourceId: String(newExpense._id),
        resourceName: newExpense.description,
        after: newExpense.toObject()
    });

    res.status(201).json({ success: true, message: "Expense recorded", data: newExpense });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const existing = await ExpenseModel.findOne({ _id: req.params.id, createdBy: req.user?.id, removed: { $ne: true } });
    if (!existing) { res.status(404); throw new Error('Expense not found'); }

    const sanitizedBody = sanitize(req.body || {});
    const expense = await ExpenseModel.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user?.id },
      sanitizedBody,
      { new: true }
    );
    if (!expense) { res.status(404); throw new Error('Expense not found'); }

    await logActivity({
        userId: String(req.user?.id),
        action: 'updated',
        resourceType: 'Expense',
        resourceId: String(expense._id),
        resourceName: expense.description,
        details: Object.keys(req.body),
        before: existing.toObject(),
        after: expense.toObject()
    });

    res.json({ success: true, data: expense });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const expense = await ExpenseModel.findOne({ 
      _id: req.params.id, 
      createdBy: req.user?.id,
      removed: { $ne: true }
    });
    if (!expense) {
      res.status(404);
      throw new Error('Expense not found');
    }

    expense.removed = true;
    await expense.save();

    await logActivity({
        userId: String(req.user?.id),
        action: 'deleted',
        resourceType: 'Expense',
        resourceId: String(expense._id),
        resourceName: expense.description
    });

    res.json({ success: true, message: "Expense deleted" });
  })
};
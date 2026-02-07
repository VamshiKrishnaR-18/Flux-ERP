import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { ExpenseModel } from '../models/expense.model';
import { asyncHandler } from '../utils/asyncHandler';

export const ReportsController = {
  
  getRevenueVsExpenses: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) { res.status(401); throw new Error('Unauthorized'); }

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

    const [revenue, expenses] = await Promise.all([
      InvoiceModel.aggregate([
        { 
          $match: { 
            createdBy: userId, 
            removed: { $ne: true },
            status: { $ne: 'draft' },
            date: { $gte: startOfYear, $lt: endOfYear }
          } 
        },
        { 
          $group: { 
            _id: { $month: "$date" }, 
            total: { $sum: "$total" } 
          } 
        },
        { $sort: { "_id": 1 } }
      ]),
      ExpenseModel.aggregate([
        { 
          $match: { 
            createdBy: userId,
            date: { $gte: startOfYear, $lt: endOfYear }
          } 
        },
        { 
          $group: { 
            _id: { $month: "$date" }, 
            total: { $sum: "$amount" } 
          } 
        },
        { $sort: { "_id": 1 } }
      ])
    ]);

    
    const data = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const rev = revenue.find(r => r._id === month)?.total || 0;
      const exp = expenses.find(e => e._id === month)?.total || 0;
      return {
        month: new Date(0, i).toLocaleString('default', { month: 'short' }),
        revenue: rev,
        expenses: exp,
        profit: rev - exp
      };
    });

    res.json({ success: true, data });
  }),

  // 2. Expense Breakdown by Category
  getExpenseBreakdown: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) { res.status(401); throw new Error('Unauthorized'); }

    const breakdown = await ExpenseModel.aggregate([
      { $match: { createdBy: userId } },
      { 
        $group: { 
          _id: "$category", 
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        } 
      },
      { $sort: { total: -1 } }
    ]);

    res.json({ success: true, data: breakdown });
  }),

  // 3. Tax Report
  getTaxReport: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) { res.status(401); throw new Error('Unauthorized'); }

    const taxData = await InvoiceModel.aggregate([
      { 
        $match: { 
          createdBy: userId, 
          removed: { $ne: true },
          status: { $ne: 'draft' } 
        } 
      },
      {
        $group: {
          _id: null,
          totalTax: { $sum: "$taxTotal" },
          totalTaxable: { $sum: "$subTotal" },
          totalRevenue: { $sum: "$total" }
        }
      }
    ]);

    res.json({ success: true, data: taxData[0] || { totalTax: 0, totalTaxable: 0, totalRevenue: 0 } });
  })
};

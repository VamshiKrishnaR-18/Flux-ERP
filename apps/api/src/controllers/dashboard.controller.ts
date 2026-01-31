import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';
import { ExpenseModel } from '../models/expense.model';

export const DashboardController = {
  getStats: async (req: Request, res: Response) => {
    try {
      // 1. Total Revenue (Everything except Drafts)
      const revenueResult = await InvoiceModel.aggregate([
        { $match: { status: { $ne: 'draft' }, removed: { $ne: true } } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]);
      const totalRevenue = revenueResult[0]?.total || 0;

      // ✅ NEW: Calculate Total Expenses
      const expenseResult = await ExpenseModel.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const totalExpenses = expenseResult[0]?.total || 0;

      // ✅ NEW: Calculate Profit
      const netProfit = totalRevenue - totalExpenses;

      // 2. Pending Amount (Everything that is NOT Draft AND NOT Paid)
      // This logic safely catches 'pending', 'sent', 'overdue', etc.
      const pendingResult = await InvoiceModel.aggregate([
        { 
          $match: { 
            status: { $nin: ['draft', 'paid'] }, 
            removed: { $ne: true } 
          } 
        },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]);
      const pendingAmount = pendingResult[0]?.total || 0;

      // 3. Counts
      const totalInvoices = await InvoiceModel.countDocuments({ removed: { $ne: true } });
      const totalClients = await ClientModel.countDocuments({ status: 'active' });
      
      // 4. Recent Invoices
      const recentInvoices = await InvoiceModel.find({ removed: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('clientId', 'name');

      // 5. Monthly Aggregation
      const monthlyRevenue = await InvoiceModel.aggregate([
        { $match: { status: { $ne: 'draft' }, removed: { $ne: true } } },
        {
          $group: {
            _id: { $month: "$date" }, 
            income: { $sum: "$total" }
          }
        }
      ]);

      // 6. Trend Calculation
      const currentMonth = new Date().getMonth() + 1;
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;

      const thisMonthIncome = monthlyRevenue.find(m => m._id === currentMonth)?.income || 0;
      const lastMonthIncome = monthlyRevenue.find(m => m._id === lastMonth)?.income || 0;

      let trendPercentage = 0;
      if (lastMonthIncome > 0) {
        trendPercentage = ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
      } else if (thisMonthIncome > 0) {
        trendPercentage = 100;
      }

      // 7. Chart Data
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const chartData = months.map((name, index) => {
        const found = monthlyRevenue.find(item => item._id === index + 1);
        return {
          name,
          income: found ? found.income : 0,
          expense: 0 
        };
      });

      res.json({
        success: true,
        data: { 
          totalRevenue, 
          totalExpenses,
          netProfit,
          totalInvoices, 
          pendingAmount, 
          totalClients, 
          recentInvoices,
          chartData,
          trendPercentage 
        }
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to fetch stats" });
    }
  }
};
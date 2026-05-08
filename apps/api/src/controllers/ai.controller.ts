import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/response';
import { InvoiceModel } from '../models/invoice.model';
import { ActivityLogModel } from '../models/activity.model';
import { ExpenseModel } from '../models/expense.model';
import { ClientModel } from '../models/client.model';
import { ProductModel } from '../models/product.model';

export const getDashboardInsights = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  // Aggregate data for AI analysis
  const [
    totalRevenue,
    totalExpenses,
    pendingInvoices,
    overdueInvoices,
    recentActivities
  ] = await Promise.all([
    InvoiceModel.aggregate([
      { $match: { createdBy: userId, removed: false } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]),
    ExpenseModel.aggregate([
      { $match: { createdBy: userId, removed: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    InvoiceModel.countDocuments({ createdBy: userId, status: 'sent', removed: false }),
    InvoiceModel.aggregate([
      { $match: { createdBy: userId, status: 'overdue', removed: false } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]),
    ActivityLogModel.find({ userId }).sort({ at: -1 }).limit(10).lean()
  ]);

  const revenue = totalRevenue[0]?.total || 0;
  const expenses = totalExpenses[0]?.total || 0;
  const overdue = overdueInvoices[0]?.total || 0;

  const insights = await aiService.generateFinancialInsights({
    totalRevenue: revenue,
    totalExpenses: expenses,
    netProfit: revenue - expenses,
    pendingInvoices,
    overdueAmount: overdue,
    revenueTrend: 12.5, // This would ideally be calculated from history
    recentActivities
  });

  return sendResponse(res, 200, true, "AI insights generated", { insights });
});

export const askAssistant = asyncHandler(async (req: Request, res: Response) => {
  const { message, isDemoMode } = req.body;
  const userId = req.user?.id;

  if (!message) {
    return sendResponse(res, 400, false, "Message is required");
  }

  let contextData;

  if (isDemoMode) {
    // In Demo Mode, use the mock data provided in the request or a default set
    // For simplicity, we'll use a snapshot of the MOCK_DATA we've been using
    contextData = {
      summary: {
        totalRevenue: 125430.50,
        totalExpenses: 45200.20,
        netProfit: 80230.30,
        totalInvoices: 80,
        totalClients: 15,
        totalProducts: 11,
        pendingInvoices: 12,
        overdueAmount: 4200.00,
      },
      topClients: [
        { name: 'Stark Industries', revenue: 45000 },
        { name: 'Acme Corp', revenue: 12500 },
        { name: 'Global Tech', revenue: 8400 }
      ],
      recentActivities: [
        "Invoice INV-001 created for Acme Corp",
        "Payment of $1,500 received from Acme Corp",
        "Quote for Stark Industries accepted"
      ]
    };
  } else {
    // Fetch real context for the AI
    const [
      invoices,
      clients,
      products,
      expenses
    ] = await Promise.all([
      InvoiceModel.find({ createdBy: userId, removed: false }).limit(20).lean(),
      ClientModel.find({ userId, removed: false }).limit(20).lean(),
      ProductModel.find({ createdBy: userId, removed: false }).limit(20).lean(),
      ExpenseModel.find({ createdBy: userId, removed: false }).limit(20).lean()
    ]);

    contextData = {
      summary: {
        totalInvoices: invoices.length,
        totalClients: clients.length,
        totalProducts: products.length,
        totalExpenses: expenses.length,
      },
      recentInvoices: invoices.map(i => ({ number: i.number, total: i.total, status: i.status, client: i.clientId })),
      clients: clients.map(c => ({ name: c.name, email: c.email })),
      products: products.map(p => ({ name: p.name, price: p.price })),
      expenses: expenses.map(e => ({ description: e.description, amount: e.amount, date: e.date }))
    };
  }

  const response = await aiService.getChatWithContext(message, contextData);

  return sendResponse(res, 200, true, "Assistant responded", { response });
});

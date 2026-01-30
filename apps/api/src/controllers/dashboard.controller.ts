import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';

export const DashboardController = {
  getStats: async (req: Request, res: Response) => {
    try {
      // 1. Total Revenue (Paid & Sent invoices)
      const revenueResult = await InvoiceModel.aggregate([
        { $match: { status: { $ne: 'draft' }, removed: { $ne: true } } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]);
      const totalRevenue = revenueResult[0]?.total || 0;

      // 2. Counts
      const totalInvoices = await InvoiceModel.countDocuments({ removed: { $ne: true } });
      const pendingInvoices = await InvoiceModel.countDocuments({ status: 'pending', removed: { $ne: true } });
      const totalClients = await ClientModel.countDocuments({ status: 'active' });

      // 3. Recent Invoices
      const recentInvoices = await InvoiceModel.find({ removed: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('clientId', 'name');

      res.json({
        success: true,
        data: { totalRevenue, totalInvoices, pendingInvoices, totalClients, recentInvoices }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to fetch stats" });
    }
  }
};
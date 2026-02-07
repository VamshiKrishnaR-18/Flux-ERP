import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';
import { ExpenseModel } from '../models/expense.model';
import { ProductModel } from '../models/product.model';
import { asyncHandler } from '../utils/asyncHandler';

export const DashboardController = {
  getStats: asyncHandler(async (req: Request, res: Response) => {
		const userId = String(req.user?.id || '');
		if (!userId) {
			res.status(401);
			throw new Error('Unauthorized');
		}

		const now = new Date();
		const startOfYear = new Date(now.getFullYear(), 0, 1);
		const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);

		const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
		const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const endLastMonth = startThisMonth;

		const invoiceBaseMatch = { createdBy: userId, removed: { $ne: true } };
		const revenueMatch = { ...invoiceBaseMatch, status: { $ne: 'draft' } };
		const outstandingMatch = { ...invoiceBaseMatch, status: { $nin: ['draft', 'paid'] } };
		const expenseBaseMatch = { createdBy: userId };

    // 1. Total Revenue
		const [
			revenueResult,
			expenseResult,
			pendingResult,
			totalInvoices,
			totalClients,
			recentInvoices,
			monthlyRevenue,
			monthlyExpenses,
			thisMonthRevenueResult,
			lastMonthRevenueResult,
			invoiceAgingFacet,
			topClients
		] = await Promise.all([
			InvoiceModel.aggregate([
				{ $match: revenueMatch },
				{ $group: { _id: null, total: { $sum: "$total" } } }
			]),
			ExpenseModel.aggregate([
				{ $match: expenseBaseMatch },
				{ $group: { _id: null, total: { $sum: "$amount" } } }
			]),
			InvoiceModel.aggregate([
				{ $match: { ...invoiceBaseMatch, status: { $in: ['pending', 'sent', 'overdue'] } } },
				{ $group: { _id: null, total: { $sum: "$total" } } }
			]),
			InvoiceModel.countDocuments(invoiceBaseMatch),
			ClientModel.countDocuments({ userId, status: 'active', removed: { $ne: true } }),
			InvoiceModel.find(invoiceBaseMatch)
				.sort({ date: -1 })
				.limit(5)
				.populate('clientId', 'name'),
			InvoiceModel.aggregate([
				{ $match: { ...revenueMatch, date: { $gte: startOfYear, $lt: startOfNextYear } } },
				{ $group: { _id: { $month: "$date" }, income: { $sum: "$total" } } }
			]),
			ExpenseModel.aggregate([
				{ $match: { ...expenseBaseMatch, date: { $gte: startOfYear, $lt: startOfNextYear } } },
				{ $group: { _id: { $month: "$date" }, expense: { $sum: "$amount" } } }
			]),
			InvoiceModel.aggregate([
				{ $match: { ...revenueMatch, date: { $gte: startThisMonth, $lt: startNextMonth } } },
				{ $group: { _id: null, total: { $sum: "$total" } } }
			]),
			InvoiceModel.aggregate([
				{ $match: { ...revenueMatch, date: { $gte: startLastMonth, $lt: endLastMonth } } },
				{ $group: { _id: null, total: { $sum: "$total" } } }
			]),
			InvoiceModel.aggregate([
				{ $match: outstandingMatch },
				{
					$facet: {
						current: [
							{ $match: { expiredDate: { $gte: now } } },
							{ $group: { _id: null, amount: { $sum: "$total" }, count: { $sum: 1 } } }
						],
						overdue1_30: [
							{ $match: { expiredDate: { $lt: now, $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } },
							{ $group: { _id: null, amount: { $sum: "$total" }, count: { $sum: 1 } } }
						],
						overdue31_60: [
							{ $match: { expiredDate: { $lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), $gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) } } },
							{ $group: { _id: null, amount: { $sum: "$total" }, count: { $sum: 1 } } }
						],
						overdue61_90: [
							{ $match: { expiredDate: { $lt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } } },
							{ $group: { _id: null, amount: { $sum: "$total" }, count: { $sum: 1 } } }
						],
						overdue90_plus: [
							{ $match: { expiredDate: { $lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } } },
							{ $group: { _id: null, amount: { $sum: "$total" }, count: { $sum: 1 } } }
						]
					}
				}
			]),
			InvoiceModel.aggregate([
				{ $match: revenueMatch },
				{
					$group: {
						_id: "$clientId",
						revenue: { $sum: "$total" },
						invoiceCount: { $sum: 1 },
						outstanding: {
							$sum: {
								$cond: [{ $ne: ["$status", "paid"] }, "$total", 0]
							}
						}
					}
				},
				{ $sort: { revenue: -1 } },
				{ $limit: 5 },
				{ $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
				{ $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
				{
					$project: {
						_id: 0,
						clientId: '$_id',
						name: '$client.name',
						revenue: 1,
						invoiceCount: 1,
						outstanding: 1
					}
				}
			])
		]);

		const totalRevenue = revenueResult[0]?.total || 0;
		const totalExpenses = expenseResult[0]?.total || 0;
		const netProfit = totalRevenue - totalExpenses;
		const pendingAmount = pendingResult[0]?.total || 0;

		const thisMonthIncome = thisMonthRevenueResult[0]?.total || 0;
		const lastMonthIncome = lastMonthRevenueResult[0]?.total || 0;

		let trendPercentage = 0;
		if (lastMonthIncome > 0) {
			trendPercentage = ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
		} else if (thisMonthIncome > 0) {
			trendPercentage = 100;
		}

		const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		const chartData = months.map((name, index) => {
			const incomeFound = monthlyRevenue.find((item: any) => item._id === index + 1);
			const expenseFound = monthlyExpenses.find((item: any) => item._id === index + 1);
			return {
				name,
				income: incomeFound ? incomeFound.income : 0,
				expense: expenseFound ? expenseFound.expense : 0
			};
		});

		const facet = invoiceAgingFacet?.[0] || {};
		const pickBucket = (key: string) => {
			const entry = facet?.[key]?.[0];
			return { amount: entry?.amount || 0, count: entry?.count || 0 };
		};
		const invoiceAging = {
			current: pickBucket('current'),
			overdue1_30: pickBucket('overdue1_30'),
			overdue31_60: pickBucket('overdue31_60'),
			overdue61_90: pickBucket('overdue61_90'),
			overdue90_plus: pickBucket('overdue90_plus')
		};
		const overdueAmount =
			invoiceAging.overdue1_30.amount +
			invoiceAging.overdue31_60.amount +
			invoiceAging.overdue61_90.amount +
			invoiceAging.overdue90_plus.amount;
		const overdueCount =
			invoiceAging.overdue1_30.count +
			invoiceAging.overdue31_60.count +
			invoiceAging.overdue61_90.count +
			invoiceAging.overdue90_plus.count;

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
				trendPercentage,
				invoiceAging,
				overdueAmount,
				overdueCount,
				topClients
      }
    });
  }),
  search: asyncHandler(async (req: Request, res: Response) => {
		const userId = String(req.user?.id || '');
		if (!userId) {
			res.status(401);
			throw new Error('Unauthorized');
		}

		const q = String(req.query.q || '').trim();
		if (!q) {
			res.json({ success: true, data: { clients: [], invoices: [], products: [] } });
			return;
		}

		const clientQuery = {
			userId,
			removed: { $ne: true },
			$or: [
				{ name: { $regex: q, $options: 'i' } },
				{ email: { $regex: q, $options: 'i' } },
				{ phoneNumber: { $regex: q, $options: 'i' } }
			]
		};

		const clients = await ClientModel.find(clientQuery)
			.select('name email phoneNumber')
			.limit(5)
			.lean();

		const searchNum = Number(q);
		const invoiceQuery: any = { createdBy: userId, removed: { $ne: true } };
		if (!isNaN(searchNum)) {
			invoiceQuery.number = searchNum;
		} else {
			const matchingClients = await ClientModel.find({
				userId,
				removed: { $ne: true },
				name: { $regex: q, $options: 'i' }
			}).select('_id');
			const clientIds = matchingClients.map(c => c._id);
			if (clientIds.length > 0) {
				invoiceQuery.clientId = { $in: clientIds };
			} else {
				invoiceQuery._id = null;
			}
		}

		const invoices = await InvoiceModel.find(invoiceQuery)
			.select('number invoicePrefix status total date clientId')
			.populate('clientId', 'name')
			.sort({ date: -1 })
			.limit(5)
			.lean();

		const products = await ProductModel.find({
			createdBy: userId,
			$or: [
				{ name: { $regex: q, $options: 'i' } },
				{ sku: { $regex: q, $options: 'i' } }
			]
		})
			.select('name sku price stock')
			.sort({ createdAt: -1 })
			.limit(5)
			.lean();

		res.json({ success: true, data: { clients, invoices, products } });
	})
};

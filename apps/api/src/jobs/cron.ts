import cron from 'node-cron';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';
import { emailService } from '../services/email.service';
import { logger } from '../utils/logger';
import { generateInvoiceNumber } from '../utils/generators';

export const processRecurringInvoices = async () => {
    logger.info("Checking for recurring invoices...");
    const today = new Date();
    
    const recurringInvoices = await InvoiceModel.find({
        recurring: { $ne: 'none' },
        removed: { $ne: true }
    });

    for (const inv of recurringInvoices) {
        const lastDate = inv.lastRecurringAt || inv.date;
        const nextDate = new Date(lastDate);

        switch (inv.recurring) {
            case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
            case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
            case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
            case 'annually': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
            case 'quarter': nextDate.setMonth(nextDate.getMonth() + 3); break;
            default: continue;
        }

        if (nextDate <= today) {
            logger.info(`Generating recurring invoice from #${inv.number} for client ${inv.clientId}`);
            
            const nextNumber = await generateInvoiceNumber(inv.createdBy);
            
            // Calculate new expiry date based on original terms (duration between original date and expiredDate)
            const originalDuration = new Date(inv.expiredDate).getTime() - new Date(inv.date).getTime();
            const newExpiredDate = new Date(nextDate.getTime() + originalDuration);

            const newInvoice = new InvoiceModel({
                ...inv.toObject(),
                _id: undefined, // Let MongoDB generate new ID
                number: nextNumber,
                date: nextDate,
                expiredDate: newExpiredDate,
                status: 'sent', // Auto-send
                paymentStatus: 'unpaid',
                amountPaid: 0,
                auditLogs: [{ action: 'created', userId: 'system-recurring', at: new Date(), changes: ['Generated automatically via recurring schedule'] }],
                createdAt: undefined,
                updatedAt: undefined,
                lastRecurringAt: undefined 
            });

            await newInvoice.save();

            // Fetch client to send email
            const client = await ClientModel.findById(inv.clientId);
            if (client && client.email) {
                await emailService.sendInvoice(newInvoice, client);
                logger.info(`📧 Sent recurring invoice #${nextNumber} to ${client.email}`);
            }

            // Update the original invoice's lastRecurringAt to prevent double generation
            inv.lastRecurringAt = nextDate;
            await inv.save();
            
            logger.info(`✅ Generated Recurring Invoice #${nextNumber}`);
        }
    }
};

export const checkOverdueInvoices = async () => {
    logger.info("Running overdue invoice check...");
    const today = new Date();
    
    const result = await InvoiceModel.updateMany(
      { 
        status: { $in: ['pending', 'sent'] }, 
        expiredDate: { $lt: today },          
        removed: { $ne: true } 
      },
      { 
        $set: { status: 'overdue' }           
      }
    );
    logger.info(`Updated ${result.modifiedCount} overdue invoices.`);
};


export const startCronJobs = () => {
  logger.info("⏰ Cron Jobs: Initialized");

  
  cron.schedule('0 0 * * *', () => {
      checkOverdueInvoices().catch(err => logger.error("Cron Job Failed:", err));
      processRecurringInvoices().catch(err => logger.error("Recurring Job Failed:", err));
  });
};
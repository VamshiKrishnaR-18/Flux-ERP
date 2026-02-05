import cron from 'node-cron';
import { InvoiceModel } from '../models/invoice.model';
import { logger } from '../utils/logger';

// Logic: Can be called by Node-Cron OR Lambda
export const checkOverdueInvoices = async () => {
    logger.info("Running overdue invoice check...");
    const today = new Date();
    
    const result = await InvoiceModel.updateMany(
      { 
        status: { $in: ['pending', 'sent'] }, // Check active invoices
        expiredDate: { $lt: today },          // That are past due
        removed: { $ne: true } 
      },
      { 
        $set: { status: 'overdue' }           // Mark as Red
      }
    );
    logger.info(`Updated ${result.modifiedCount} overdue invoices.`);
};

// Scheduler: For Local/Docker usage
export const startCronJobs = () => {
  logger.info("⏰ Cron Jobs: Initialized");

  // Run every night at Midnight (00:00)
  cron.schedule('0 0 * * *', () => {
      checkOverdueInvoices().catch(err => logger.error("Cron Job Failed:", err));
  });
};
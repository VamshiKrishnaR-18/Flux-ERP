import cron from 'node-cron';
import { InvoiceModel } from '../models/invoice.model';
import { logger } from '../utils/logger';


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
  });
};
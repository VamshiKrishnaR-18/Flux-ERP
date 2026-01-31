import cron from 'node-cron';
import { InvoiceModel } from '../models/invoice.model';

export const startCronJobs = () => {
  console.log("⏰ Cron Jobs: Initialized");

  // Run every night at Midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log("Running overdue invoice check...");
    const today = new Date();
    
    await InvoiceModel.updateMany(
      { 
        status: { $in: ['pending', 'sent'] }, // Check active invoices
        expiredDate: { $lt: today },          // That are past due
        removed: { $ne: true } 
      },
      { 
        $set: { status: 'overdue' }           // Mark as Red
      }
    );
  });
};
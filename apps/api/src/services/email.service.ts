import nodemailer from 'nodemailer';

// 1. Setup Transporter (Gmail, Outlook, or SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or use 'host' and 'port' for custom SMTP
  auth: {
    user: process.env.SMTP_EMAIL, // e.g. yourcompany@gmail.com
    pass: process.env.SMTP_PASSWORD // App Password (not login password)
  }
});

export const EmailService = {
  
  // 📩 Send Invoice
  sendInvoice: async (invoice: any, client: any) => {
    try {
      const info = await transporter.sendMail({
        from: `"Flux ERP" <${process.env.SMTP_EMAIL}>`,
        to: client.email,
        subject: `Invoice #${invoice.number} from Flux ERP`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Invoice #${invoice.number}</h2>
            <p>Hi ${client.name},</p>
            <p>Here is your invoice for <strong>$${invoice.total.toFixed(2)}</strong>.</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.expiredDate).toDateString()}</p>
            <br />
            <a href="${process.env.FRONTEND_URL}/invoices/${invoice._id}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invoice</a>
            <p style="margin-top: 20px; color: #888; font-size: 12px;">Thank you for your business!</p>
          </div>
        `
      });
      console.log("✅ Email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("❌ Email failed:", error);
      return false;
    }
  },

  // 💬 Send Quote
  sendQuote: async (quote: any, client: any) => {
    try {
      await transporter.sendMail({
        from: `"Flux ERP" <${process.env.SMTP_EMAIL}>`,
        to: client.email,
        subject: `Quote #${quote.number} - ${quote.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Quote #${quote.number}</h2>
            <p>Hi ${client.name},</p>
            <p>Here is the estimate for <strong>${quote.title}</strong>.</p>
            <p><strong>Total:</strong> $${quote.total.toFixed(2)}</p>
            <br />
            <p>Please reply to this email to approve or reject this quote.</p>
            <br />
            <a href="${process.env.FRONTEND_URL}/quotes" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Quote</a>
          </div>
        `
      });
      return true;
    } catch (error) {
      console.error("❌ Email failed:", error);
      return false;
    }
  }
};
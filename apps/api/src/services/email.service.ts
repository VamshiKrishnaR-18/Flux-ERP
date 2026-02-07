import nodemailer from 'nodemailer';
import { config } from '../config/env';


const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: false, 
  auth: {
    user: config.smtpUser, 
    pass: config.smtpPass  
  }
});

export const EmailService = {
  
  
  sendInvoice: async (invoice: any, client: any) => {
    try {
      const info = await transporter.sendMail({
        from: `"Flux ERP" <${config.smtpUser}>`, 
        to: client.email,
        subject: `Invoice #${invoice.number} from Flux ERP`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Invoice #${invoice.number}</h2>
            <p>Hi ${client.name},</p>
            <p>Here is your invoice for <strong>$${invoice.total.toFixed(2)}</strong>.</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.expiredDate).toDateString()}</p>
            <br />
            <a href="${config.frontendUrl}/invoices/${invoice._id}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invoice</a>
            <p style="margin-top: 20px; color: #888; font-size: 12px;">Thank you for your business!</p>
          </div>
        `
      });

      console.log("✅ Email sent:", info.messageId);
     
      console.log("🔗 Preview URL:", nodemailer.getTestMessageUrl(info)); 
      
      return true;
    } catch (error) {
      console.error("❌ Email failed:", error);
      return false;
    }
  },

  
  sendQuote: async (quote: any, client: any) => {
    try {
      const info = await transporter.sendMail({
        from: `"Flux ERP" <${config.smtpUser}>`,
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
            <a href="${config.frontendUrl}/quotes" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Quote</a>
          </div>
        `
      });

      console.log("✅ Quote Email sent:", info.messageId);
      
      console.log("🔗 Preview URL:", nodemailer.getTestMessageUrl(info));

      return true;
    } catch (error) {
      console.error("❌ Email failed:", error);
      return false;
    }
  },

  //  Password Reset
  sendPasswordReset: async (email: string, resetUrl: string) => {
    try {
      const info = await transporter.sendMail({
        from: `"Flux ERP" <${config.smtpUser}>`,
        to: email,
        subject: "Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Reset Your Password</h2>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <br />
            <a href="${resetUrl}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p style="margin-top: 20px; color: #888; font-size: 12px;">This link expires in 10 minutes.</p>
          </div>
        `
      });
      console.log("✅ Reset Email sent:", info.messageId);
      console.log("🔗 Preview URL:", nodemailer.getTestMessageUrl(info));
      return true;
    } catch (error) {
      console.error("❌ Reset Email failed:", error);
      return false;
    }
  }
};

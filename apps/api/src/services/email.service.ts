import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { SettingsModel } from '../models/settings.model';

export class EmailService {
  private transporter;

  constructor() {
    if (!config.smtpUser || !config.smtpPass) {
      console.warn('⚠️ SMTP credentials missing. Email service will not work.');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: false, 
      auth: {
        user: config.smtpUser, 
        pass: config.smtpPass  
      }
    });
  }

  async sendInvoice(invoice: any, client: any) {
    if (!this.transporter) {
      console.error("❌ Email failed: Transporter not initialized (missing credentials)");
      return false;
    }
    try {
      const settings = await SettingsModel.findOne({ userId: invoice.createdBy });
      const primaryColor = settings?.primaryColor || '#000';
      const companyName = settings?.companyName || 'Flux ERP';

      const info = await this.transporter.sendMail({
        from: `"${companyName}" <${config.smtpUser}>`, 
        to: client.email,
        subject: `Invoice #${invoice.number} from ${companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: ${primaryColor};">Invoice #${invoice.number}</h2>
            <p>Hi ${client.name},</p>
            <p>Here is your invoice for <strong>$${invoice.total.toFixed(2)}</strong>.</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.expiredDate).toDateString()}</p>
            <br />
            <a href="${config.frontendUrl}/p/invoice/${invoice._id}" style="background: ${primaryColor}; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Invoice</a>
            <p style="margin-top: 30px; color: #888; font-size: 12px; border-top: 1px solid #eee; pt: 20px;">
              Thank you for choosing ${companyName}!
            </p>
          </div>
        `
      });

      console.log("✅ Email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("❌ Email failed:", error);
      return false;
    }
  }

  async sendReminder(invoice: any, client: any) {
    if (!this.transporter) {
      console.error("❌ Reminder failed: Transporter not initialized (missing credentials)");
      return false;
    }
    try {
      const settings = await SettingsModel.findOne({ userId: invoice.createdBy });
      const primaryColor = settings?.primaryColor || '#000';
      const companyName = settings?.companyName || 'Flux ERP';

      const info = await this.transporter.sendMail({
        from: `"${companyName}" <${config.smtpUser}>`, 
        to: client.email,
        subject: `REMINDER: Payment for Invoice #${invoice.number} is Overdue`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #e11d48;">Payment Reminder</h2>
            <p>Hi ${client.name},</p>
            <p>This is a friendly reminder that payment for <strong>Invoice #${invoice.number}</strong> was due on <strong>${new Date(invoice.expiredDate).toDateString()}</strong>.</p>
            <p>The total balance due is <strong>$${(invoice.total - (invoice.amountPaid || 0)).toFixed(2)}</strong>.</p>
            <br />
            <a href="${config.frontendUrl}/p/invoice/${invoice._id}" style="background: ${primaryColor}; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View & Pay Invoice</a>
            <p style="margin-top: 30px; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
              If you have already made the payment, please disregard this email.
            </p>
          </div>
        `
      });

      console.log("✅ Reminder sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("❌ Reminder failed:", error);
      return false;
    }
  }

  async sendQuote(quote: any, client: any) {
    if (!this.transporter) {
      console.error("❌ Quote failed: Transporter not initialized (missing credentials)");
      return false;
    }
    try {
      const settings = await SettingsModel.findOne({ userId: quote.createdBy });
      const primaryColor = settings?.primaryColor || '#000';
      const companyName = settings?.companyName || 'Flux ERP';

      const info = await this.transporter.sendMail({
        from: `"${companyName}" <${config.smtpUser}>`,
        to: client.email,
        subject: `Quote #${quote.number} - ${quote.title} from ${companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: ${primaryColor};">Quote #${quote.number}</h2>
            <p>Hi ${client.name},</p>
            <p>Here is the estimate for <strong>${quote.title}</strong>.</p>
            <p><strong>Total:</strong> $${quote.total.toFixed(2)}</p>
            <br />
            <p>You can view and approve this quote directly via the link below:</p>
            <br />
            <a href="${config.frontendUrl}/p/quote/${quote._id}" style="background: ${primaryColor}; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View & Approve Quote</a>
            <p style="margin-top: 30px; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
              Thank you for considering ${companyName}!
            </p>
          </div>
        `
      });

      console.log("✅ Quote Email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("❌ Email failed:", error);
      return false;
    }
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    if (!this.transporter) {
      console.error("❌ Reset failed: Transporter not initialized (missing credentials)");
      return false;
    }
    try {
      const info = await this.transporter.sendMail({
        from: `"Flux ERP Support" <${config.smtpUser}>`,
        to: email,
        subject: "Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px; max-width: 500px;">
            <h2 style="color: #2563eb;">Reset Your Password</h2>
            <p>You requested a password reset for your Flux ERP account. Click the button below to set a new password:</p>
            <br />
            <a href="${resetUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
            <p style="margin-top: 25px; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 15px;">
              This link expires in 10 minutes. If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `
      });
      console.log("✅ Reset Email sent:", info.messageId);
      return true;
    } catch (error) {
      console.log("❌ Reset Email failed:", error);
      return false;
    }
  }

  async sendInventoryAlert(product: any, adminEmail: string) {
    if (!this.transporter) {
      console.error("❌ Inventory Alert failed: Transporter not initialized (missing credentials)");
      return false;
    }
    try {
      await this.transporter.sendMail({
        from: `"Flux ERP Alerts" <${config.smtpUser}>`,
        to: adminEmail,
        subject: `⚠️ Low Stock Alert: ${product.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #d97706;">Low Stock Alert</h2>
            <p>The following product has fallen below its minimum stock level:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Product</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${product.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Current Stock</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; color: #ef4444; font-weight: bold;">${product.stock}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Minimum Level</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${product.minStock}</td>
              </tr>
            </table>
            <div style="margin-top: 20px;">
               <a href="${config.frontendUrl}/products" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage Inventory</a>
            </div>
          </div>
        `
      });
      return true;
    } catch (error) {
      console.error("❌ Inventory Alert failed:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
import nodemailer from 'nodemailer';

// 1. Setup Transporter (Generic SMTP for Ethereal/Gmail)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Defined in .env
    pass: process.env.SMTP_PASS  // Defined in .env
  }
});

export const EmailService = {
  
  // 📩 Send Invoice
  sendInvoice: async (invoice: any, client: any) => {
    try {
      const info = await transporter.sendMail({
        from: `"Flux ERP" <${process.env.SMTP_USER}>`, // Sender address
        to: client.email,
        subject: `Invoice #${invoice.number} from Flux ERP`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Invoice #${invoice.number}</h2>
            <p>Hi ${client.name},</p>
            <p>Here is your invoice for <strong>$${invoice.total.toFixed(2)}</strong>.</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.expiredDate).toDateString()}</p>
            <br />
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/invoices/${invoice._id}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invoice</a>
            <p style="margin-top: 20px; color: #888; font-size: 12px;">Thank you for your business!</p>
          </div>
        `
      });

      console.log("✅ Email sent:", info.messageId);
      // 🌟 MAGIC LINE: Logs the URL to view the email in browser
      console.log("🔗 Preview URL:", nodemailer.getTestMessageUrl(info)); 
      
      return true;
    } catch (error) {
      console.error("❌ Email failed:", error);
      return false;
    }
  },

  // 💬 Send Quote
  sendQuote: async (quote: any, client: any) => {
    try {
      const info = await transporter.sendMail({
        from: `"Flux ERP" <${process.env.SMTP_USER}>`,
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
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/quotes" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Quote</a>
          </div>
        `
      });

      console.log("✅ Quote Email sent:", info.messageId);
      // 🌟 MAGIC LINE
      console.log("🔗 Preview URL:", nodemailer.getTestMessageUrl(info));

      return true;
    } catch (error) {
      console.error("❌ Email failed:", error);
      return false;
    }
  },

  // 🔐 Password Reset
  sendPasswordReset: async (email: string, resetUrl: string) => {
    try {
      const info = await transporter.sendMail({
        from: `"Flux ERP" <${process.env.SMTP_USER}>`,
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
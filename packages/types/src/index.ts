import { z } from 'zod';

// 1. AUTH
export const RegisterSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['admin', 'user']).default('user'),
});

export const LoginSchema = z.object({ 
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;
export type LoginDTO = z.infer<typeof LoginSchema>;


// 2. CLIENTS 
export const ClientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  address: z.string().optional(),
  removed: z.boolean().optional().default(false), 
});
export type ClientDTO = z.infer<typeof ClientSchema>;

export interface Client extends ClientDTO {
  _id: string;

}


// User Definition
export const UserSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  password: z.string().optional(), 
  role: z.enum(['admin', 'user']).default('user'),
  createdAt: z.date().optional(),
  resetPasswordToken: z.string().optional(),
  resetPasswordExpire: z.date().optional(),
});
export type UserType = z.infer<typeof UserSchema>;


// 3. INVOICES 
export const InvoiceItemSchema = z.object({
  productId: z.string().optional(),
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().min(1),
  price: z.number().min(0),
  total: z.number(), 
});
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const InvoiceStatusSchema = z.enum(['draft', 'pending', 'sent', 'paid', 'overdue']);

export const CreateInvoiceSchema = z.object({
  number: z.number().optional(), 
  year: z.number().optional(),   
  recurring: z.enum(['daily', 'weekly', 'monthly', 'annually', 'quarter', 'none']).default('none'),
  status: InvoiceStatusSchema.default('draft'),
  paymentStatus: z.enum(['unpaid', 'paid', 'partially']).default('unpaid'),
  date: z.string().or(z.date()), 
  expiredDate: z.string().or(z.date()),
  clientId: z.string().min(1, "Client is required"), 
  items: z.array(InvoiceItemSchema).min(1, "Add at least one item"),
  notes: z.string().optional(),
  currency: z.string().default('USD'),
  subTotal: z.number().default(0),
  taxRate: z.number().min(0).default(0),
  taxTotal: z.number().default(0),
  total: z.number().default(0),
  credit: z.number().default(0),
  discount: z.number().min(0).default(0), 
});

export type CreateInvoiceDTO = z.infer<typeof CreateInvoiceSchema>;

export interface InvoiceAuditLog {
  action: 'created' | 'updated';
  userId: string;
  at: string | Date;
  changes?: string[];
}

export interface Invoice extends CreateInvoiceDTO {
  _id: string;
  createdAt: string;
  updatedAt: string;
  amountPaid?: number;
  removed?: boolean; 
  auditLogs?: InvoiceAuditLog[];
}


// 4. PAYMENTS 
export const PaymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  date: z.string().or(z.date()),
  method: z.enum(['cash', 'bank_transfer', 'check', 'credit_card', 'other']),
  notes: z.string().optional(),
});
export type PaymentDTO = z.infer<typeof PaymentSchema>;


// 5. PRODUCTS 
export const ProductSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  stock: z.number().int().default(0),
  sku: z.string().optional(), 
});

export type ProductDTO = z.infer<typeof ProductSchema>;

export interface Product extends ProductDTO {
  _id: string;
  createdAt: string;
  updatedAt: string;
}


// 6. EXPENSES 
export const ExpenseSchema = z.object({
  description: z.string().min(2, "Description is required"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"), 
  category: z.string().default('Operational'),
  date: z.coerce.date(), 
  receipt: z.string().optional(),
});

export type CreateExpenseDTO = z.infer<typeof ExpenseSchema>;

export interface Expense extends CreateExpenseDTO {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}


// 7. QUOTES 
export const QuoteSchema = CreateInvoiceSchema.extend({
  title: z.string().min(1, "Title is required"), 
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'converted']).default('draft'),
  convertedInvoiceId: z.string().optional(),
});

export type CreateQuoteDTO = z.infer<typeof QuoteSchema>;

export interface Quote extends CreateQuoteDTO {
  _id: string;
  number: number;
  createdAt: string;
  updatedAt: string;
}


// 8. SETTINGS 
export const SettingsSchema = z.object({
  companyName: z.string().min(1, "Company Name is required"),
  companyEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  companyWebsite: z.string().optional(),
  currency: z.string().default('USD'),
  taxRate: z.coerce.number().min(0).default(0), 
  invoicePrefix: z.string().default('INV-'),
  
  invoiceStartNumber: z.coerce.number().min(1).default(1000), 
  defaultPaymentTerms: z.coerce.number().min(0).default(14), 
  defaultNotes: z.string().optional().default('Thank you for your business!'),
});

export type SettingsDTO = z.infer<typeof SettingsSchema>;

// GLOBAL CONSTANTS
export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (A$)' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar (C$)' },
] as const;

export const PAYMENT_TERMS = [
  { value: 0, label: 'Due on Receipt' },
  { value: 7, label: 'Net 7 Days' },
  { value: 14, label: 'Net 14 Days' },
  { value: 30, label: 'Net 30 Days' },
  { value: 45, label: 'Net 45 Days' },
  { value: 60, label: 'Net 60 Days' },
] as const;

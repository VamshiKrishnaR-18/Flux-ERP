import { z } from 'zod';

// 1. Validation for a Single Line Item
export const InvoiceItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price cannot be negative"),
  total: z.number(), // Validated existence, but backend should ideally recalculate
});

// 2. Validation for Creating an Invoice
export const CreateInvoiceSchema = z.object({
  // Identification
  number: z.number().min(1),
  year: z.number().int().min(2000).max(2100),
  recurring: z.enum(['daily', 'weekly', 'monthly', 'annually', 'quarter', 'none']).default('none'),
  
  // Dates (Handle string input from JSON)
  date: z.string().datetime({ message: "Invalid date format" }).or(z.date()),
  expiredDate: z.string().datetime({ message: "Invalid due date format" }).or(z.date()),
  
  // Relations
  clientId: z.string().min(1, "Client is required"), 
  
  // Content
  items: z.array(InvoiceItemSchema).min(1, "Invoice must have at least one item"),
  notes: z.string().optional(),
  
  // Financials
  currency: z.string().min(3).max(3).toUpperCase().default('USD'),
  subTotal: z.number().min(0),
  taxRate: z.number().min(0).default(0),
  taxTotal: z.number().min(0).default(0),
  total: z.number().min(0),
  credit: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  
  // Statuses
  status: z.enum(['draft', 'pending', 'sent', 'refunded', 'cancelled', 'on hold']).default('draft'),
  paymentStatus: z.enum(['unpaid', 'paid', 'partially']).default('unpaid'),
});

// 3. Validation for Updating (All fields optional)
export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();
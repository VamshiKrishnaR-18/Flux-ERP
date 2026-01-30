import { z } from 'zod';

// 1. Auth & Users
export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user']).default('user'),
});
export type User = z.infer<typeof UserSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginType = z.infer<typeof loginSchema>;

// 2. Clients
export const ClientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});
export type ClientDTO = z.infer<typeof ClientSchema>;

export interface Client extends ClientDTO {
  _id: string;
}

// 3. Invoices
export const InvoiceItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().min(1),
  price: z.number().min(0),
  total: z.number(), 
});

export const CreateInvoiceSchema = z.object({
  // Backend Generated
  number: z.number().optional(), 
  year: z.number().optional(),   
  
  // Enums - We use .default() to ensure they always have a value
  recurring: z.enum(['daily', 'weekly', 'monthly', 'annually', 'quarter', 'none']).default('none'),
  status: z.enum(['draft', 'pending', 'sent', 'paid']).default('draft'),
  paymentStatus: z.enum(['unpaid', 'paid', 'partially']).default('unpaid'),
  
  // Dates - Accept string (from JSON/Form) or Date
  date: z.string().or(z.date()), 
  expiredDate: z.string().or(z.date()),
  
  clientId: z.string().min(1, "Client is required"), 
  items: z.array(InvoiceItemSchema).min(1, "Add at least one item"),
  notes: z.string().optional(),
  
  // Financials
  currency: z.string().default('USD'),
  subTotal: z.number().default(0),
  taxRate: z.number().min(0).default(0),
  taxTotal: z.number().default(0),
  total: z.number().default(0),
  credit: z.number().default(0),
  discount: z.number().min(0).default(0), 
});

export type CreateInvoiceDTO = z.infer<typeof CreateInvoiceSchema>;

export interface Invoice extends CreateInvoiceDTO {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// 4. Products / Inventory
export const ProductSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  stock: z.number().int().default(0),
  sku: z.string().optional(), // Stock Keeping Unit (Unique ID)
});

export type ProductDTO = z.infer<typeof ProductSchema>;

export interface Product extends ProductDTO {
  _id: string;
  createdAt: string;
  updatedAt: string;
}
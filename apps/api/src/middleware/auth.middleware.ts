import { Request, Response, NextFunction, RequestHandler } from "express";
import { createClerkClient } from "@clerk/clerk-sdk-node";
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { UserModel } from '../models/user.model';
import { ClientModel } from '../models/client.model';
import { ProductModel } from '../models/product.model';
import { InvoiceModel } from '../models/invoice.model';
import { SettingsModel } from '../models/settings.model';
import { ExpenseModel } from '../models/expense.model';
import { QuoteModel } from '../models/quote.model';
import bcrypt from 'bcryptjs';

const clerkClient = createClerkClient({ secretKey: config.clerkSecretKey });

// Seed demo data for a user
const seedDemoData = async (userId: string) => {
  // Check if user already has data
  const existingClients = await ClientModel.countDocuments({ userId });
  if (existingClients > 0) return;

  // Create settings
  await SettingsModel.create({
    userId,
    taxRate: 10,
    currency: 'USD',
    companyName: 'Flux ERP Demo',
    companyEmail: 'contact@flux.com',
    companyAddress: '123 Tech Lane, Silicon Valley, CA'
  });

  // Create clients
  const baseClients = [
    { name: 'TechNova Solutions', email: 'technova.io', type: 'IT' },
    { name: 'GreenLeaf Logistics', email: 'greenleaf.com', type: 'Transport' },
    { name: 'Apex Financial', email: 'apexfin.com', type: 'Finance' },
    { name: 'Quantum Health', email: 'quantumhealth.org', type: 'Health' },
    { name: 'Zenith Architecture', email: 'zenitharch.net', type: 'Design' }
  ];

  const scaledClients = [];
  for (let i = 0; i < 10; i++) {
    const base = baseClients[i % baseClients.length]!;
    scaledClients.push({
      userId,
      name: `${base.name} ${Math.floor(i / 5) + 1}`,
      email: `contact${i}@${base.email}`,
      phoneNumber: `+1-555-0${100 + i}`,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      address: `${100 + i} Business Park, Suite ${i}, San Francisco, CA`
    });
  }
  const clients = await ClientModel.create(scaledClients);

  // Create products
  const baseProducts = [
    { name: 'Enterprise License', price: 5000 },
    { name: 'Consulting (Hr)', price: 150 },
    { name: 'Audit Service', price: 2000 },
    { name: 'Security Scan', price: 3500 },
    { name: 'API Integration', price: 1200 }
  ];

  const scaledProducts = [];
  for (let i = 0; i < 15; i++) {
    const base = baseProducts[i % baseProducts.length]!;
    scaledProducts.push({
      createdBy: userId,
      name: `${base.name} v${Math.floor(i / 5) + 1}.0`,
      description: `Professional ${base.name} for enterprise needs`,
      price: base.price + (i * 10) 
    });
  }
  const products = await ProductModel.create(scaledProducts);

  // Create invoices
  const invoices = [];
  const INVOICE_COUNT = 30;

  for (let i = 0; i < INVOICE_COUNT; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)]!;
    const product1 = products[Math.floor(Math.random() * products.length)]!;
    const product2 = products[Math.floor(Math.random() * products.length)]!;

    const q1 = Math.floor(Math.random() * 5) + 1;
    const q2 = Math.floor(Math.random() * 3) + 1;

    const total1 = product1.price * q1;
    const total2 = product2.price * q2;
    const subTotal = total1 + total2;
    const taxTotal = subTotal * 0.1;

    const date = new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000);

    invoices.push({
      createdBy: userId,
      number: 10001 + i,
      year: 2024,
      clientId: client._id,
      date,
      expiredDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
      items: [
        { itemName: product1.name, quantity: q1, price: product1.price, total: total1 },
        { itemName: product2.name, quantity: q2, price: product2.price, total: total2 }
      ],
      subTotal,
      taxRate: 10,
      taxTotal,
      total: subTotal + taxTotal,
      status: Math.random() > 0.3 ? 'paid' : (Math.random() > 0.5 ? 'pending' : 'overdue')
    });
  }
  await InvoiceModel.create(invoices);

  // Create expenses
  const expenseCategories = ['Operational', 'Marketing', 'Software', 'Travel', 'Contractors', 'Office Supplies'];
  const expenses = [];
  const EXPENSE_COUNT = 40;

  for (let i = 0; i < EXPENSE_COUNT; i++) {
    const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)]!;
    const date = new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000);
    const amount = Math.floor(Math.random() * 2000) + 50;

    expenses.push({
      createdBy: userId,
      description: `${category} Expense #${i + 1}`,
      amount,
      date,
      category
    });
  }
  await ExpenseModel.create(expenses);

  // Create quotes
  const quotes = [];
  const QUOTE_COUNT = 20;

  for (let i = 0; i < QUOTE_COUNT; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)]!;
    const product = products[Math.floor(Math.random() * products.length)]!;
    const q = Math.floor(Math.random() * 10) + 1;
    const total = product.price * q;

    quotes.push({
      createdBy: userId,
      number: 5000 + i,
      title: `Project Quote for ${client.name}`,
      date: new Date(),
      expiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      clientId: client._id,
      items: [
        { itemName: product.name, quantity: q, price: product.price, total }
      ],
      subTotal: total,
      taxRate: 10,
      taxTotal: total * 0.1,
      total: total * 1.1,
      status: ['draft', 'sent', 'accepted', 'rejected'][Math.floor(Math.random() * 4)]
    });
  }
  await QuoteModel.create(quotes);

  logger.info('Seeded demo data');
};

export const authMiddleware: RequestHandler = async (req, res, next) => {
  // Check for demo mode header
  const isDemoMode = req.headers['x-demo-mode'] === 'true';

  if (isDemoMode) {
    try {
      // Find or create demo user
      let demoUser = await UserModel.findOne({ email: 'demo@example.com' });
      
      if (!demoUser) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        demoUser = await UserModel.create({
          name: 'Demo User',
          email: 'demo@example.com',
          password: hashedPassword,
          role: 'admin'
        });
        logger.info('Created demo user');
      }
      
      // Seed demo data if needed
      await seedDemoData(demoUser._id.toString());
      
      req.user = {
        id: demoUser._id.toString(),
        role: demoUser.role,
        email: demoUser.email,
      };
      
      return next();
    } catch (error: any) {
      logger.error('Demo Mode Authentication Error:', {
        message: error.message
      });
      res.status(500).json({ 
        success: false, 
        message: "Demo mode error"
      });
      return;
    }
  }

  // Normal Clerk auth for non-demo mode
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.__session) {
    token = req.cookies.__session;
  }

  if (!token) {
    res.status(401).json({ success: false, message: "Access Denied: No Token" });
    return;
  }

  try {
    const sessionClaims = await clerkClient.verifyToken(token);
    
    req.user = {
      id: sessionClaims.sub,
      role: (sessionClaims as any).role || 'user',
      email: (sessionClaims as any).email,
    };
    
    next();
  } catch (error: any) {
    logger.error('Authentication Error:', {
      message: error.message,
      code: error.code
    });
    res.status(403).json({ 
      success: false, 
      message: "Invalid Token"
    });
  }
};

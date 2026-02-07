import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { ClientModel } from '../models/client.model';
import { ProductModel } from '../models/product.model';
import { InvoiceModel } from '../models/invoice.model';
import { SettingsModel } from '../models/settings.model';
import { ExpenseModel } from '../models/expense.model';
import { QuoteModel } from '../models/quote.model';

dotenv.config();


const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

const seed = async () => {
  try {
    
    const safeUri = MONGO_URI.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔌 Connecting to MongoDB at: ${safeUri}`);
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    
    await UserModel.deleteMany({});
    await ClientModel.deleteMany({});
    await ProductModel.deleteMany({});
    await InvoiceModel.deleteMany({});
    await SettingsModel.deleteMany({});
    await ExpenseModel.deleteMany({});
    await QuoteModel.deleteMany({});
    console.log('🗑️ Cleared Database');

    
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await UserModel.create({
      name: 'Demo User',
      email: 'demo@example.com',
      password: hashedPassword,
      role: 'admin'
    });
    console.log('👤 Created User: demo@example.com / password123');

    
    await SettingsModel.create({
        userId: user._id,
        taxRate: 10,
        currency: 'USD',
        companyName: 'Flux ERP Demo',
        companyEmail: 'contact@flux.com',
        companyAddress: '123 Tech Lane, Silicon Valley, CA'
    });

    
    const baseClients = [
        { name: 'TechNova Solutions', email: 'technova.io', type: 'IT' },
        { name: 'GreenLeaf Logistics', email: 'greenleaf.com', type: 'Transport' },
        { name: 'Apex Financial', email: 'apexfin.com', type: 'Finance' },
        { name: 'Quantum Health', email: 'quantumhealth.org', type: 'Health' },
        { name: 'Zenith Architecture', email: 'zenitharch.net', type: 'Design' }
    ];

    const scaledClients = [];
    for (let i = 0; i < 50; i++) {
        const base = baseClients[i % baseClients.length]!;
        scaledClients.push({
            userId: user._id,
            name: `${base.name} ${Math.floor(i / 5) + 1}`,
            email: `contact${i}@${base.email}`,
            phoneNumber: `+1-555-0${100 + i}`,
            status: Math.random() > 0.1 ? 'active' : 'inactive',
            address: `${100 + i} Business Park, Suite ${i}, San Francisco, CA`
        });
    }
    const clients = await ClientModel.create(scaledClients);
    console.log(`🏢 Created ${clients.length} Clients (Scaled)`);

    
    const baseProducts = [
        { name: 'Enterprise License', price: 5000 },
        { name: 'Consulting (Hr)', price: 150 },
        { name: 'Audit Service', price: 2000 },
        { name: 'Security Scan', price: 3500 },
        { name: 'API Integration', price: 1200 }
    ];

    const scaledProducts = [];
    for (let i = 0; i < 30; i++) {
        const base = baseProducts[i % baseProducts.length]!;
        scaledProducts.push({
            createdBy: user._id,
            name: `${base.name} v${Math.floor(i / 5) + 1}.0`,
            description: `Professional ${base.name} for enterprise needs`,
            price: base.price + (i * 10) 
        });
    }
    const products = await ProductModel.create(scaledProducts);
    console.log(`📦 Created ${products.length} Products (Scaled)`);

    
    const invoices = [];
    const INVOICE_COUNT = 200;
    
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
            createdBy: user._id,
            number: 10001 + i,
            year: 2024,
            clientId: client._id,
            date: date,
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
    console.log(`📄 Created ${invoices.length} Invoices (Scaled)`);

    
    const expenseCategories = ['Operational', 'Marketing', 'Software', 'Travel', 'Contractors', 'Office Supplies'];
    const expenses = [];
    const EXPENSE_COUNT = 300;

    for (let i = 0; i < EXPENSE_COUNT; i++) {
        const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
        
        const date = new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000);
        const amount = Math.floor(Math.random() * 2000) + 50;

        expenses.push({
            createdBy: user._id,
            description: `${category} Expense #${i+1}`,
            amount: amount,
            date: date,
            category: category
        });
    }
    await ExpenseModel.create(expenses);
    console.log(`💸 Created ${expenses.length} Expenses (Scaled)`);

    
    const quotes = [];
    const QUOTE_COUNT = 100;

    for (let i = 0; i < QUOTE_COUNT; i++) {
        const client = clients[Math.floor(Math.random() * clients.length)]!;
        const product = products[Math.floor(Math.random() * products.length)]!;
        const q = Math.floor(Math.random() * 10) + 1;
        const total = product.price * q;

        quotes.push({
            createdBy: user._id,
            number: 5000 + i,
            title: `Project Quote for ${client.name}`,
            date: new Date(),
            expiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            clientId: client._id,
            items: [
                { itemName: product.name, quantity: q, price: product.price, total: total }
            ],
            subTotal: total,
            taxRate: 10,
            taxTotal: total * 0.1,
            total: total * 1.1,
            status: ['draft', 'sent', 'accepted', 'rejected'][Math.floor(Math.random() * 4)]
        });
    }
    await QuoteModel.create(quotes);
    console.log(`📜 Created ${quotes.length} Quotes (Scaled)`);

    console.log('✅ Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
};

seed();
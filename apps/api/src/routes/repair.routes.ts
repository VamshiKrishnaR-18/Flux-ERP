import { Router } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';
import { UserModel } from '../models/user.model'; // ✅ Import User Model

const router = Router();

router.get('/fix-data', async (req, res) => {
    try {
        // 1. Find a valid User ID to use as a fallback
        const adminUser = await UserModel.findOne();
        // If no user exists, use a fake Object ID (just to pass validation)
        const fallbackUserId = adminUser ? adminUser._id.toString() : "654321654321654321654321"; 

        let fixedInvoices = 0;
        
        // 2. Fetch ALL invoices
        const invoices = await InvoiceModel.find({});

        for (const inv of invoices) {
            // --- FIX 1: Convert Strings to Numbers ---
            inv.total = Number(inv.total) || 0;
            inv.subTotal = Number(inv.subTotal) || 0;
            inv.taxTotal = Number(inv.taxTotal) || 0;
            inv.amountPaid = Number(inv.amountPaid) || 0;
            
            if (inv.items && inv.items.length > 0) {
                inv.items = inv.items.map(item => ({
                    ...item,
                    price: Number(item.price) || 0,
                    quantity: Number(item.quantity) || 0,
                    total: Number(item.total) || 0
                }));
            }

            // --- FIX 2: Backfill Missing 'createdBy' ---
            // If this invoice is missing the creator, assign it to the Admin
            if (!inv.createdBy) {
                inv.createdBy = fallbackUserId; 
            }

            // Save (Now validation will pass!)
            inv.markModified('items');
            await inv.save();
            fixedInvoices++;
        }

        // 3. Fix Clients
        await ClientModel.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'active' } }
        );

        res.json({ 
            success: true, 
            message: `Database Repair Complete. Fixed ${fixedInvoices} invoices (Assigned missing owners to ${adminUser?.name || 'Admin'}).` 
        });

    } catch (error) {
        console.error("Repair Error:", error);
        res.status(500).json({ error: error });
    }
});

export default router;
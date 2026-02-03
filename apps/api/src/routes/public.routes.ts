import { Router } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { SettingsModel } from '../models/settings.model';

const router = Router();

// GET Public Invoice (No Auth Required)
router.get('/invoices/:id', async (req, res) => {
    try {
        const invoice = await InvoiceModel.findById(req.params.id).populate('clientId');
        if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

        // We also need the company settings to display the logo/address on the public page
        // Assuming the invoice has a 'createdBy' field, we find settings for that user
        const settings = await SettingsModel.findOne({ userId: invoice.createdBy });

        res.json({ success: true, data: { invoice, settings } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;
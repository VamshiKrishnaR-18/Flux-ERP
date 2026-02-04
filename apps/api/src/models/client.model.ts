import mongoose, { Schema } from "mongoose";
import { Client } from '@erp/types';

// We need to tell Mongoose that 'removed' is a valid field
const ClientSchema = new Schema<Client>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    
    // ✅ ADD THIS FIELD
    removed: { type: Boolean, default: false } 
}, {
    timestamps: true
});

export const ClientModel = mongoose.model<Client>('Client', ClientSchema);
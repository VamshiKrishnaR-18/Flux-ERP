import mongoose, { Schema } from "mongoose";


const ClientSchema = new Schema({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    address: { type: String },
    
    portalToken: { type: String, unique: true, sparse: true, index: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    removed: { type: Boolean, default: false }
}, {
    timestamps: true
});

export const ClientModel = mongoose.model('Client', ClientSchema);
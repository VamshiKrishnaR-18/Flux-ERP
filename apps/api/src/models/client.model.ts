import mongoose, { Schema } from "mongoose";

// NOTE: We intentionally keep the backend model independent from the shared DTO
// types so we can include system fields like userId.
const ClientSchema = new Schema({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    address: { type: String },
    // Public read-only portal access (unguessable token)
    portalToken: { type: String, unique: true, sparse: true, index: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    removed: { type: Boolean, default: false }
}, {
    timestamps: true
});

export const ClientModel = mongoose.model('Client', ClientSchema);
import mongoose, { Schema } from "mongoose";
import {ClientType} from '@erp/types';


const ClientSchema = new Schema<ClientType>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: {type: String},
    status: {type: String, enum: ['active', 'inactive'], default:'active'}
},{
    timestamps: true
})


export const ClientModel = mongoose.model<ClientType>('Client', ClientSchema);
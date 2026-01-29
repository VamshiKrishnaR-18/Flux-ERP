import mongoose, { Schema } from "mongoose";
import {Client} from '@erp/types';


const ClientSchema = new Schema<Client>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: {type: String},
    status: {type: String, enum: ['active', 'inactive'], default:'active'}
},{
    timestamps: true
})


export const ClientModel = mongoose.model<Client>('Client', ClientSchema);
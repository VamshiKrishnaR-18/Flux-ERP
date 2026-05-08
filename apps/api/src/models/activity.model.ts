import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  userId: string;
  action: 'created' | 'updated' | 'deleted' | 'paid' | 'sent' | 'converted';
  resourceType: 'Invoice' | 'Quote' | 'Client' | 'Product' | 'Expense' | 'Settings';
  resourceId: string;
  resourceName?: string; // e.g. "Invoice #1024" or "John Doe"
  details?: string[];
  before?: any; // Snapshot before update
  after?: any;  // Snapshot after update
  at: Date;
}

const ActivityLogSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  action: { 
    type: String, 
    enum: ['created', 'updated', 'deleted', 'paid', 'sent', 'converted'], 
    required: true 
  },
  resourceType: { 
    type: String, 
    enum: ['Invoice', 'Quote', 'Client', 'Product', 'Expense', 'Settings'], 
    required: true,
    index: true
  },
  resourceId: { type: String, required: true, index: true },
  resourceName: { type: String },
  details: [{ type: String }],
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  at: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

export const ActivityLogModel = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

import { ActivityLogModel } from '../models/activity.model';
import { logger } from './logger';

interface LogParams {
  userId: string;
  action: 'created' | 'updated' | 'deleted' | 'paid' | 'sent' | 'converted';
  resourceType: 'Invoice' | 'Quote' | 'Client' | 'Product' | 'Expense' | 'Settings';
  resourceId: string;
  resourceName?: string;
  details?: string[];
  before?: any;
  after?: any;
}

export const logActivity = async (params: LogParams) => {
  try {
    await ActivityLogModel.create({
      ...params,
      at: new Date()
    });
  } catch (error) {
    logger.error('Failed to log activity:', error);
  }
};

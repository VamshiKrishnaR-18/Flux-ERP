import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: any;
  requestId?: string;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message?: string,
  data?: T,
  pagination?: ApiResponse['pagination']
) => {
  const response: ApiResponse<T> = {
    success,
    message,
    data,
    pagination,
    requestId: (res.req as any).requestId,
  };

  return res.status(statusCode).json(response);
};

export const successResponse = <T>(
  res: Response,
  data?: T,
  message = 'Success',
  statusCode = 200,
  pagination?: ApiResponse['pagination']
) => {
  return sendResponse(res, statusCode, true, message, data, pagination);
};

export const errorResponse = (
  res: Response,
  message = 'Error',
  statusCode = 500,
  error?: any
) => {
  const response: ApiResponse = {
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined,
    requestId: (res.req as any).requestId,
  };

  return res.status(statusCode).json(response);
};

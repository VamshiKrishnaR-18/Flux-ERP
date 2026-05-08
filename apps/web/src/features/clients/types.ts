export interface Client {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string; 
  status: 'active' | 'inactive';
  address?: string;     
  removed?: boolean;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
  createdAt?: string;
}
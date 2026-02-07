export interface Client {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string; 
  status: 'active' | 'inactive';
  address?: string;     
  removed?: boolean;
  createdAt?: string;
}
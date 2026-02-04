export interface Client {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string; // Ensure this matches backend (backend uses phoneNumber, sometimes just phone)
  status: 'active' | 'inactive';
  address?: string;     // ✅ FIX: Add this line
  removed?: boolean;
  createdAt?: string;
}
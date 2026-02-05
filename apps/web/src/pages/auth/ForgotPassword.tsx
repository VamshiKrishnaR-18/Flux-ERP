import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { api } from '../../lib/axios';
import { toast } from 'sonner';

// Validation Schema
const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordDTO>({
    resolver: zodResolver(ForgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordDTO) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgotpassword', data);
      setIsSent(true);
      toast.success('Reset link sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We have sent a password reset link to your email address.
          </p>
          <Link 
            to="/login" 
            className="text-blue-600 hover:underline font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">Forgot Password</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Enter your email to receive a password reset link
        </p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              {...register('email')} 
              type="email" 
              placeholder="name@example.com"
              className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-black text-white py-2 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Remember your password? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

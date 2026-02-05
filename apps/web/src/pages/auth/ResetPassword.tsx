import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { toast } from 'sonner';

// Validation Schema
const ResetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordDTO>({
    resolver: zodResolver(ResetPasswordSchema)
  });

  const onSubmit = async (data: ResetPasswordDTO) => {
    if (!token) {
      toast.error('Invalid token');
      return;
    }

    setIsLoading(true);
    try {
      await api.put(`/auth/resetpassword/${token}`, { password: data.password });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">Reset Password</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Enter your new password below
        </p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input 
              {...register('password')} 
              type="password" 
              className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input 
              {...register('confirmPassword')} 
              type="password" 
              className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-black text-white py-2 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          <Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

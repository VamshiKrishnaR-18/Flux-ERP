import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios'; // Direct API call for register
import { toast } from 'sonner';
import { RegisterSchema, type RegisterDTO } from '@erp/types';

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterDTO>({
    resolver: zodResolver(RegisterSchema) as Resolver<RegisterDTO> // ✅ STRICT TYPE FIX
  });

  const onSubmit = async (data: RegisterDTO) => {
    setIsLoading(true);
    try {
      await api.post('/auth/register', data);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Create Account</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input {...register('name')} className="w-full border p-2 rounded-lg" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input {...register('email')} type="email" className="w-full border p-2 rounded-lg" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input {...register('password')} type="password" className="w-full border p-2 rounded-lg" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-black text-white py-2 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50">
            {isLoading ? 'Creating...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
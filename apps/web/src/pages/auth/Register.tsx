import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, type RegisterDTO } from '@erp/types'; 
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios'; 
import { toast } from 'sonner';

	export default function Register() {
	  const [isLoading, setIsLoading] = useState(false);
	  const [showPassword, setShowPassword] = useState(false);
	  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterDTO>({
    resolver: zodResolver(RegisterSchema) as Resolver<RegisterDTO>, // ✅ STRICT TYPE FIX
    defaultValues: { name: '', email: '', password: '', role: 'user' }
  });

  const onSubmit = async (data: RegisterDTO) => {
    setIsLoading(true);
    try {
      await api.post('/auth/register', data);
      toast.success('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
        setIsLoading(false);
    }
  };

	  return (
	    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
	      <div className="w-full max-w-md">
	        <div className="mb-6 text-center">
	          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create your account</h1>
	          <p className="mt-2 text-sm text-gray-500">Set up FluxERP to manage clients, invoices and expenses.</p>
	        </div>

	        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
	          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
	            <div>
	              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
	              <input 
	                {...register('name')} 
	                placeholder="Alex Smith"
	                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
	              />
	              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
	            </div>
	            <div>
	              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
	              <input 
	                {...register('email')} 
	                type="email" 
	                placeholder="you@company.com"
	                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
	              />
	              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
	            </div>
	            <div>
	              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
	              <div className="relative">
	                <input 
	                  type={showPassword ? 'text' : 'password'} 
	                  {...register('password')} 
	                  placeholder="••••••••"
	                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm pr-16"
	                />
	                <button
	                  type="button"
	                  onClick={() => setShowPassword((prev) => !prev)}
	                  className="absolute inset-y-0 right-2 flex items-center px-2 text-xs font-medium text-gray-500 hover:text-gray-700"
	                >
	                  {showPassword ? 'Hide' : 'Show'}
	                </button>
	              </div>
	              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
	            </div>
	
	            <button 
	              type="submit" 
	              disabled={isLoading} 
	              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
	            >
	              {isLoading ? 'Creating account...' : 'Create account'}
	            </button>
	          </form>
	
	          <p className="mt-6 text-center text-sm text-gray-600">
	            Already have an account?{' '}
	            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
	              Sign in
	            </Link>
	          </p>
	        </div>
	      </div>
	    </div>
	  );
}
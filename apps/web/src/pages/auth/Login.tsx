import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { LoginSchema, type LoginDTO } from '@erp/types';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginDTO>({
    resolver: zodResolver(LoginSchema) as Resolver<LoginDTO>
  });

  const onSubmit = async (data: LoginDTO) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

	return (
	  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
	    <div className="w-full max-w-md">
	      <div className="mb-6 text-center">
	        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h1>
	        <p className="mt-2 text-sm text-gray-500">Sign in to manage your clients, invoices and expenses.</p>
	      </div>

	      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
	        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
	                {...register('password')} 
	                type={showPassword ? 'text' : 'password'} 
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
	          
	          <div className="flex items-center justify-between text-sm">
	            <span className="text-gray-500">
	              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
	              Secure sign-in
	            </span>
	            <Link to="/forgot-password" className="text-blue-600 hover:underline font-medium">
	              Forgot password?
	            </Link>
	          </div>

	          <button 
	            type="submit" 
	            disabled={isLoading}
	            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm mt-2"
	          >
	            {isLoading ? 'Signing in...' : 'Sign in'}
	          </button>
	        </form>
	
	        <p className="mt-6 text-center text-sm text-gray-600">
	          Don&apos;t have an account?{' '}
	          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
	            Create account
	          </Link>
	        </p>
	      </div>
	    </div>
	  </div>
	);
}
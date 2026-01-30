import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginType } from '@erp/types';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/axios'; // ✅ Use shared API

export default function Login() {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginType>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data: LoginType) => {
    try {
      setMessage('Verifying credentials...');
      
      // ✅ FIX: Use 'api.post' (Uses VITE_API_URL automatically)
      const response = await api.post('/auth/login', data);
      
      // SAVE THE TOKEN
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setMessage('✅ Success! Entering Flux ERP...');
      setTimeout(() => navigate('/'), 1000); // Go to Dashboard
      
    } catch (error: any) {
      setMessage('❌ Error: ' + (error.response?.data?.message || "Login failed"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">Welcome Back</h1>
        <p className="text-center text-gray-500 mb-6">Login to Flux ERP</p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input {...register("email")} className="w-full border p-2 rounded mt-1" />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" {...register("password")} className="w-full border p-2 rounded mt-1" />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <button type="submit" className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition">
            Login
          </button>
        </form>

        {message && <div className={`mt-4 text-center font-bold text-sm ${message.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>{message}</div>}

        <p className="mt-4 text-center text-sm text-gray-600">
          New here? <Link to="/register" className="text-blue-600 hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
}
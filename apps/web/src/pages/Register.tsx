import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserSchema, type UserType } from '@erp/types';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'user' as const
    }
  });

  const onSubmit = async (data: UserType) => {
    try {
      setMessage('Creating account...');
      await axios.post('http://localhost:3000/auth/register', data);
      setMessage('✅ Success! Redirecting to login...');
      
      // Wait 1.5 seconds then go to login
      setTimeout(() => navigate('/login'), 1500);
      
    } catch (error: any) {
      setMessage('❌ Error: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">Join Flux ERP</h1>
        <p className="text-center text-gray-500 mb-6">Create your professional account</p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input {...register("name")} className="w-full border p-2 rounded mt-1" placeholder="Elon Musk" />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input {...register("email")} className="w-full border p-2 rounded mt-1" placeholder="elon@tesla.com" />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" {...register("password")} className="w-full border p-2 rounded mt-1" placeholder="••••••" />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message as string}</p>}
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
            Sign Up
          </button>
        </form>

        {message && <div className="mt-4 text-center font-bold text-sm">{message}</div>}

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
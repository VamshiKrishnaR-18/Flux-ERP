import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientSchema, type ClientType } from '@erp/types'; 

export default function App() {
  const [message, setMessage] = useState('');

  // FIX: Removed <ClientType> generic. 
  // We let the resolver infer the types automatically to handle the "Default Value" logic.
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(ClientSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      // FIX: Added 'as const' so TS knows this is strictly "active", not just any string
      status: 'active' as const 
    }
  });

  const onSubmit = async (data: ClientType) => {
    try {
      setMessage('Sending...');
      const response = await axios.post('http://localhost:3000/clients', data);
      setMessage(`✅ Success: Created client ${response.data.data.name}`);
    } catch (error: any) {
      if (error.response?.status === 409) {
        setMessage('❌ Error: Email already exists');
      } else {
        setMessage('❌ Error: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 text-center">Flux ERP</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* NAME FIELD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input 
              {...register("name")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
              placeholder="e.g. Tesla Inc."
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>}
          </div>

          {/* EMAIL FIELD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              {...register("email")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="contact@company.com" 
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message as string}</p>}
          </div>

          {/* HIDDEN STATUS FIELD */}
          <input type="hidden" {...register("status")} />

          <button 
            type="submit"
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition font-medium"
          >
            Create Client
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded text-center text-sm font-medium ${message.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
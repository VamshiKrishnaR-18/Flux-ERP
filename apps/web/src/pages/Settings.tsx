import { useState, useEffect } from 'react';

import axios from 'axios'; // 1. Import Axios
import { toast } from 'sonner';

export default function Settings() {
  const token = localStorage.getItem('token');
  const [isLoading, setIsLoading] = useState(false);

  // Default State
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    companyAddress: '',
    taxId: '',
    currency: 'USD',
  });

  // 2. Load from API on mount ☁️
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('http://localhost:3000/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.data) {
          setFormData(response.data.data);
        }
      } catch (error) {
        toast.error("Failed to load settings");
      }
    };
    fetchSettings();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Save to API ☁️
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading("Saving settings...");

    try {
      await axios.put('http://localhost:3000/settings', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Company settings saved!", { id: toastId });
    } catch (error) {
      toast.error("Failed to save settings", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Company Settings</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* ... (Same inputs as before: Company Name, Email, Address, Tax ID) ... */}
            {/* Example Input Reuse: */}
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5"
              />
            </div>
            {/* (Repeat for other fields) */}
            
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import ProtectedLayout from './pages/ProtectedLayout'; // <--- Import the Guard

// === THE NEW DASHBOARD ===
function Dashboard() {
  const navigate = useNavigate();
  // Read user data from storage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    // 1. Destroy the Key
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // 2. Redirect
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Navbar */}
      <nav className="bg-black text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Flux ERP</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-300">Welcome, {user.name || 'User'}</span>
          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Client Management</h2>
          <p className="text-gray-600">This area is now secure. Only logged-in users can see this.</p>
          {/* You can re-add your "Create Client" form here later! */}
        </div>
      </div>
    </div>
  );
}

// === THE APP ROUTING ===
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED ROUTES (The Guard Wrapper) */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar (Fixed width) */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex-1 ml-64 overflow-auto">
        {/* <Outlet /> renders the current page (Dashboard, Invoices, etc.) here */}
        <Outlet />
      </div>
    </div>
  );
};
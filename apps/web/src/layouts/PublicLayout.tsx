import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl overflow-hidden min-h-[600px]">
        <Outlet />
      </div>
    </div>
  );
}
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="ml-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                FluxERP
              </span>
            </div>
	            <div className="hidden md:flex space-x-8">
	              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
	              <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">About</a>
	            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">
                Log in
              </Link>
              <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="pt-16">
        {children}
      </main>
	      <footer className="bg-gray-50 border-t border-gray-100 py-8 mt-20">
	        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
	          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
	            <p className="text-sm text-gray-500 max-w-xl">
	              FluxERP helps you manage clients, invoices, quotes and expenses in a single, simple workspace.
	            </p>
	            <p className="text-sm text-gray-400">
	              &copy; 2024 FluxERP. All rights reserved.
	            </p>
	          </div>
	        </div>
	      </footer>
    </div>
  );
}

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
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
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
      <footer className="bg-gray-50 border-t border-gray-100 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Product</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-gray-500 hover:text-gray-900">Features</a></li>
                <li><a href="#" className="text-gray-500 hover:text-gray-900">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Company</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-gray-500 hover:text-gray-900">About</a></li>
                <li><a href="#" className="text-gray-500 hover:text-gray-900">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-gray-500 hover:text-gray-900">Privacy</a></li>
                <li><a href="#" className="text-gray-500 hover:text-gray-900">Terms</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Connect</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-gray-500 hover:text-gray-900">Twitter</a></li>
                <li><a href="#" className="text-gray-500 hover:text-gray-900">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
            <p className="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
              &copy; 2024 FluxERP. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

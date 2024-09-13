import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-800">ProfilePond</Link>
          <div>
            <Link to="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center">
          <p className="text-sm text-gray-500">&copy; 2024 ProfilePond. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
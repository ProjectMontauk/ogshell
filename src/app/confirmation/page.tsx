'use client';

import Navbar from '../../../components/Navbar';

export default function ConfirmationPage() {
  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirmation Page</h1>
          <p className="text-gray-600">This page is temporarily disabled for maintenance.</p>
        </div>
      </div>
    </div>
  );
}

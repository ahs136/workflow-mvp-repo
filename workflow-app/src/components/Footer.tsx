'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} WorkFlow. All rights reserved.
        </p>
      </div>
    </footer>
  );
} 
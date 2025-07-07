'use client';

export default function Footer() {
  return (
    <footer className="bg-[#1e293b] text-white py-12 px-4 text-center">
      <div className="max-w-7xl mx-auto">
        <p className="text-sm opacity-80">
          &copy; {new Date().getFullYear()} WorkFlow. All rights reserved.
        </p>
      </div>
    </footer>
  );
} 
'use client';

export default function Profile() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>
      
      <div className="grid gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="text-gray-900">John Doe</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">john.doe@example.com</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Theme</label>
              <p className="text-gray-900">Light</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notifications</label>
              <p className="text-gray-900">Enabled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
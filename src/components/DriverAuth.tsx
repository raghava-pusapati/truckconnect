import React, { useState } from 'react';
import { storage } from '../utils/storage';

interface DriverAuthProps {
  onSuccess: () => void;
}

const DriverAuth: React.FC<DriverAuthProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    mobile: '',
    email: '',
    password: '',
    lorryType: '',
    maxCapacity: '',
    documents: {
      license: '',
      rc: '',
      fitness: '',
      insurance: ''
    }
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (isLogin) {
      const users = storage.getUsers();
      const user = users.find(u => u.email === formData.email && u.password === formData.password);
      if (user) {
        storage.setCurrentUser(user);
        onSuccess();
      } else {
        alert('Invalid credentials');
      }
    } else {
      try {
        const newUser = {
          id: Date.now().toString(),
          ...formData,
          maxCapacity: parseInt(formData.maxCapacity),
          role: 'driver' as const
        };
        await storage.saveUser(newUser);
        storage.setCurrentUser(newUser);
        onSuccess();
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred');
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: keyof typeof formData.documents) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size should be less than 5MB');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          documents: {
            ...formData.documents,
            [docType]: reader.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {isLogin ? 'Driver Login' : 'Driver Registration'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                <input
                  type="tel"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Lorry Type</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={formData.lorryType}
                  onChange={(e) => setFormData({ ...formData, lorryType: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Maximum Capacity (in tons)</label>
                <input
                  type="number"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Documents</h3>
                <p className="text-sm text-gray-500">Please ensure each file is less than 5MB</p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Driver's License</label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    className="mt-1 block w-full"
                    onChange={(e) => handleFileChange(e, 'license')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">RC Book</label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    className="mt-1 block w-full"
                    onChange={(e) => handleFileChange(e, 'rc')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fitness Certificate</label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    className="mt-1 block w-full"
                    onChange={(e) => handleFileChange(e, 'fitness')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Insurance</label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    className="mt-1 block w-full"
                    onChange={(e) => handleFileChange(e, 'insurance')}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              {isLogin ? 'Login' : 'Register'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-orange-600 hover:text-orange-500"
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverAuth;
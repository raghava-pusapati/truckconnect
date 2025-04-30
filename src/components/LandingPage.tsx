import React from 'react';
import { Truck, Users, UserCircle, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  onRoleSelect: (role: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onRoleSelect }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="relative h-[60vh] bg-cover bg-center" style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80")'
      }}>
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-4">Welcome to Truck Connect</h1>
            


            <p className="text-xl max-w-2xl mx-auto">
              Connecting India's trucking community with reliable logistics solutions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div
            onClick={() => onRoleSelect('customer')}
            className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
          >
            <Users className="h-12 w-12 text-orange-600 mb-4" />
            <h2 className="text-2xl font-bold mb-4">Customer</h2>
            <p className="text-gray-600">Post your loads and find reliable drivers for your transportation needs</p>
          </div>

          <div
            onClick={() => onRoleSelect('driver')}
            className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
          >
            <UserCircle className="h-12 w-12 text-orange-600 mb-4" />
            <h2 className="text-2xl font-bold mb-4">Delivery Partner</h2>
            <p className="text-gray-600">Find loads and grow your business with our platform</p>
          </div>

          <div
  onClick={() => onRoleSelect('admin')}
  className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
>
  <ShieldCheck className="h-12 w-12 text-orange-600 mb-4" />
  <h2 className="text-2xl font-bold mb-4">Admin</h2>
  <p className="text-gray-600">Manage platform operations</p>
</div>

        </div>
      </div>

      <div className="bg-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Truck Connect?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pan-India Network</h3>
              <p className="text-gray-600">Access to a vast network of verified drivers across India</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Partners</h3>
              <p className="text-gray-600">All our delivery partners are thoroughly verified</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
              <p className="text-gray-600">Simple and quick process to book your loads</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
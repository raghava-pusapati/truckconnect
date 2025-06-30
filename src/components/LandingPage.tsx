import React from 'react';
import { Truck, Users, UserCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onRoleSelect: (role: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onRoleSelect }) => {
  const navigate = useNavigate();

  const handleCustomerClick = () => {
    onRoleSelect('customer');
    navigate('/login');
  };

  const handleDriverClick = () => {
    onRoleSelect('driver');
    navigate('/driver-login');
  };

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

      <div className="max-w-7xl mx-auto px-4 py-16 bg-amber-50">
        <div className="grid md:grid-cols-2 gap-8 ">
          <div
            onClick={handleCustomerClick}
            className="bg-amber-950 rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
          >
            <Users className="h-12 w-12 text-orange-600 mb-4" />
            <h2 className="text-2xl text-white font-bold mb -4">Customer</h2>
            <p className="text-white">Post your loads and find reliable drivers for your transportation needs</p>
          </div>

          <div
            onClick={handleDriverClick}
            className="bg-amber-950 rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1"
          >
            <UserCircle className="h-12 w-12 text-orange-600 mb-4" />
            <h2 className="text-2xl text-white font-bold mb-4">Delivery Partner</h2>
            <p className="text-white">Find loads and grow your business with our platform</p>
          </div>
        </div>
      </div>

      <div className=" py-16 bg-amber-950">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl text-white font-bold text-center mb-12">Why Choose Truck Connect?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl text-white font-semibold mb-2">Pan-India Network</h3>
              <p className="text-white">Access to a vast network of verified drivers across India</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Verified Partners</h3>
              <p className="text-white">All our delivery partners are thoroughly verified</p>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Easy Booking</h3>
              <p className="text-white">Simple and quick process to book your loads</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
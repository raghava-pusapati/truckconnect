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
      <div className="relative h-[65vh] bg-cover bg-center" style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80")'
      }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/10" />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center text-white max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 drop-shadow-lg">
              Welcome to Truck Connect
            </h1>
            <p className="text-base sm:text-lg md:text-xl/relaxed max-w-2xl mx-auto text-white/90">
              Connecting India's trucking community with reliable logistics solutions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="grid md:grid-cols-2 gap-8">
          <div
            onClick={handleCustomerClick}
            className="group rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-1 bg-white/80 backdrop-blur border border-amber-100"
          >
            <div className="inline-flex items-center justify-center rounded-xl bg-orange-100 text-orange-700 h-14 w-14 mb-5 ring-1 ring-orange-200">
              <Users className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-amber-950">Customer</h2>
            <p className="text-amber-900/80">Post your loads and find reliable drivers for your transportation needs</p>
            <div className="mt-6 text-orange-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Get started →</div>
          </div>

          <div
            onClick={handleDriverClick}
            className="group rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-1 bg-white/80 backdrop-blur border border-amber-100"
          >
            <div className="inline-flex items-center justify-center rounded-xl bg-orange-100 text-orange-700 h-14 w-14 mb-5 ring-1 ring-orange-200">
              <UserCircle className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-amber-950">Delivery Partner</h2>
            <p className="text-amber-900/80">Find loads and grow your business with our platform</p>
            <div className="mt-6 text-orange-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Join now →</div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-amber-950">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl text-white font-extrabold text-center mb-12 tracking-tight">Why Choose Truck Connect?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-5 w-24 h-24 mx-auto mb-4 flex items-center justify-center ring-1 ring-white/15">
                <Truck className="h-10 w-10 text-orange-300" />
              </div>
              <h3 className="text-lg md:text-xl text-white font-semibold mb-2">Pan-India Network</h3>
              <p className="text-white/80">Access to a vast network of verified drivers across India</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-5 w-24 h-24 mx-auto mb-4 flex items-center justify-center ring-1 ring-white/15">
                <ShieldCheck className="h-10 w-10 text-orange-300" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Verified Partners</h3>
              <p className="text-white/80">All our delivery partners are thoroughly verified</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-5 w-24 h-24 mx-auto mb-4 flex items-center justify-center ring-1 ring-white/15">
                <Users className="h-10 w-10 text-orange-300" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Easy Booking</h3>
              <p className="text-white/80">Simple and quick process to book your loads</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
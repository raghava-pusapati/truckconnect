import React from 'react';
import { Truck, Users, UserCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface LandingPageProps {
  onRoleSelect: (role: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onRoleSelect }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
              {t('landing.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl/relaxed max-w-2xl mx-auto text-white/90">
              {t('landing.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 bg-gradient-to-b from-amber-50 to-orange-50">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">{t('landing.chooseRole')}</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">{t('landing.chooseRoleDesc')}</p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Customer Card */}
          <div
            onClick={handleCustomerClick}
            className="group relative rounded-3xl p-10 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer hover:-translate-y-2 bg-gradient-to-br from-blue-500 to-blue-700 overflow-hidden"
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white h-20 w-20 mb-6 ring-2 ring-white/30 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-bold mb-3 text-white">{t('landing.customer.title')}</h2>
              <p className="text-white/90 text-lg mb-6 leading-relaxed">
                {t('landing.customer.description')}
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-white/90">
                  <span className="mr-2">✓</span> {t('landing.customer.feature1')}
                </li>
                <li className="flex items-center text-white/90">
                  <span className="mr-2">✓</span> {t('landing.customer.feature2')}
                </li>
                <li className="flex items-center text-white/90">
                  <span className="mr-2">✓</span> {t('landing.customer.feature3')}
                </li>
              </ul>
              <div className="flex items-center text-white font-semibold text-lg group-hover:translate-x-2 transition-transform">
                {t('landing.customer.cta')} <span className="ml-2">→</span>
              </div>
            </div>
          </div>

          {/* Driver Card */}
          <div
            onClick={handleDriverClick}
            className="group relative rounded-3xl p-10 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer hover:-translate-y-2 bg-gradient-to-br from-orange-500 to-orange-700 overflow-hidden"
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white h-20 w-20 mb-6 ring-2 ring-white/30 group-hover:scale-110 transition-transform duration-300">
                <Truck className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-bold mb-3 text-white">{t('landing.driver.title')}</h2>
              <p className="text-white/90 text-lg mb-6 leading-relaxed">
                {t('landing.driver.description')}
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-white/90">
                  <span className="mr-2">✓</span> {t('landing.driver.feature1')}
                </li>
                <li className="flex items-center text-white/90">
                  <span className="mr-2">✓</span> {t('landing.driver.feature2')}
                </li>
                <li className="flex items-center text-white/90">
                  <span className="mr-2">✓</span> {t('landing.driver.feature3')}
                </li>
              </ul>
              <div className="flex items-center text-white font-semibold text-lg group-hover:translate-x-2 transition-transform">
                {t('landing.driver.cta')} <span className="ml-2">→</span>
              </div>
            </div>
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



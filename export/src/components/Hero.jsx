import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Store,
  Star,
  ArrowRight,
  Users,
  Package,
  TrendingUp,
  CheckCircle,
  Zap,
  Heart,
  Award,
  Sun,
  Moon,
} from "lucide-react";
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Hero = () => {
  const [activeCard, setActiveCard] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [statsData, setStatsData] = useState({
    total_users: '0+',
    total_sellers: '0+',
    total_products: '0+'
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);


  // Dark mode state: Initialize from localStorage or default to false
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' ? true : false;
  });

  const navigate = useNavigate(); // Initialize useNavigate hook

  // Effect to apply dark mode class and save preference to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Effect for scroll
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K+`; // Format as K+ if 1000 or more
    }
    return `${num}+`; // Otherwise, just add a plus sign
  };

  // Effect to fetch stats data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/landing/stats');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setStatsData({
            total_users: formatNumber(data.data.total_users),
            total_sellers: formatNumber(data.data.total_sellers),
            total_products: formatNumber(data.data.total_products)
          });
        } else {
          setStatsError(data.message);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStatsError('Failed to load stats. Please try again later.');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    { icon: Users, value: statsData.total_users, label: 'Active Users' },
    { icon: Store, value: statsData.total_sellers, label: 'Verified Sellers' },
    { icon: Package, value: statsData.total_products, label: 'Products' },
    { icon: TrendingUp, value: '99.9%', label: 'Uptime' } // This remains static as it's not from the API
  ];

  const features = [
    { icon: Zap, title: 'Lightning Fast', desc: 'Get groceries in 30 minutes' },
    { icon: CheckCircle, title: 'Quality Assured', desc: 'Fresh products guaranteed' },
    { icon: Heart, title: 'Customer Love', desc: '4.9/5 rating from users' },
    { icon: Award, title: 'Best Prices', desc: 'Competitive marketplace rates' }
  ];

  return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,_rgba(34,197,94,0.5)_0%,_rgba(34,197,94,0.5)_70%,_#F2FFF4_100%)] dark:bg-[linear-gradient(to_bottom_right,_#111827_0%,_#111827_70%,_rgba(6,95,70,0.2)_100%)] transition-all duration-700 relative overflow-hidden">

        {/* Clean Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Single subtle gradient mesh */}
          <div
              className="absolute top-0 right-0 w-[800px] h-[800px] opacity-30 dark:opacity-20"
              style={{
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                transform: `translate(40%, -40%) scale(${1 + scrollY * 0.0002})`
              }}
          />

          {/* Minimal geometric accent */}
          <div
              className="absolute bottom-0 left-0 w-[600px] h-[600px] opacity-20 dark:opacity-10"
              style={{
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 60%)',
                transform: `translate(-30%, 30%) scale(${1 + scrollY * 0.0001})`
              }}
          />
        </div>

        {/* Dark Mode Toggle */}
        <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="fixed top-6 right-6 p-3 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:scale-105 transition-all duration-200 z-50 shadow-lg hover:shadow-xl"
            aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12">

          {/* Header Section */}
          <div className="text-center mb-16 pt-8">
            {/* Rating Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-200/50 dark:border-gray-700/50 mb-8 shadow-lg">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rated #1 Grocery Platform</span>
              <Star className="w-4 h-4 text-amber-500 fill-current" />
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600">
              Fresh
            </span>
              <span className="text-gray-900 dark:text-white ml-4">Market</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto leading-relaxed font-light">
              Premium groceries delivered to your doorstep with unmatched quality and speed
            </p>

            {/* Clean Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-20">
              {statsLoading ? (
                  <div className="col-span-4 text-center text-gray-600 dark:text-gray-400">Loading stats...</div>
              ) : statsError ? (
                  <div className="col-span-4 text-center text-red-600 dark:text-red-400">{statsError}</div>
              ) : (
                  stats.map((stat, index) => (
                      <div
                          key={index}
                          className="group p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                      >
                        <stat.icon className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                      </div>
                  ))
              )}
            </div>
          </div>

          {/* Main Cards - Keep your existing card design */}
          <div className="grid md:grid-cols-2 gap-8 mb-20 max-w-4xl mx-auto">
            {/* Buyer Card */}
            <div
                className={`relative p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] group cursor-pointer backdrop-blur-sm ${
                    activeCard === 'buyer' ? 'scale-[1.02] shadow-2xl' : ''
                }`}
                onMouseEnter={() => setActiveCard('buyer')}
                onMouseLeave={() => setActiveCard(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                  <ShoppingCart className="h-10 w-10 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">For Buyers</h3>

                <div className="space-y-3 mb-8 text-left w-full max-w-xs">
                  {['Browse 100K+ fresh products', '24/7 customer support', 'User-Friendly'].map((feature, i) => (
                      <div key={i} className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                  ))}
                </div>

                <div className="space-y-3 w-full px-4">
                  <button
                      onClick={() => navigate('/buyer/login')}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 flex items-center justify-center space-x-2 group">
                    <span>Login as Buyer</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                      onClick={() => navigate('/buyer/register')}
                      className="w-full border-2 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105">
                    Register as Buyer
                  </button>
                </div>
              </div>
            </div>

            {/* Seller Card */}
            <div
                className={`relative p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] group cursor-pointer backdrop-blur-sm ${
                    activeCard === 'seller' ? 'scale-[1.02] shadow-2xl' : ''
                }`}
                onMouseEnter={() => setActiveCard('seller')}
                onMouseLeave={() => setActiveCard(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                  <Store className="h-10 w-10 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">For Sellers</h3>

                <div className="space-y-3 mb-8 text-left w-full max-w-xs">
                  {['Reach 50K+ active buyers', 'Real-time analytics', 'Low commission rates'].map((feature, i) => (
                      <div key={i} className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                  ))}
                </div>

                <div className="space-y-3 w-full px-4">
                  <button
                      onClick={() => navigate('/seller/login')}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center space-x-2 group">
                    <span>Login as Seller</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                      onClick={() => navigate('/seller/register')}
                      className="w-full border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105">
                    Register as Seller
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid - Simplified */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 max-w-5xl mx-auto">
            {features.map((feature, index) => (
                <div
                    key={index}
                    className="group p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 text-center hover:scale-105 hover:shadow-xl"
                >
                  <feature.icon className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">{feature.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
            ))}
          </div>

          {/* Clean CTA Section */}
          <div className="text-center bg-gradient-to-r from-emerald-500 via-blue-600 to-purple-600 rounded-3xl p-10 text-white shadow-2xl max-w-4xl mx-auto backdrop-blur-sm">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Grocery Experience?</h2>
            <p className="text-lg mb-8 opacity-90 leading-relaxed max-w-2xl mx-auto">Join thousands of satisfied customers and sellers in the future of grocery shopping</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <button
                  onClick={() => navigate('/buyer/login')}
                  className="flex-1 bg-white text-emerald-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2">
                <span>Get Started Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Hero;

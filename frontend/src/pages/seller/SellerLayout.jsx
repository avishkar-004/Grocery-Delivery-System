import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Home, Package, FileText, BarChart3, Clock, LogOut, Menu, User, DollarSign, Sun, Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from 'react-hot-toast'; // ✅ Import Toaster

const SellerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [sellerName, setSellerName] = useState("Seller");

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.name) {
          setSellerName(user.name);
        }
      } catch (e) {
        console.error("Failed to parse user data from localStorage:", e);
      }
    }
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/seller/dashboard', icon: Home },
    { name: 'Quotations', path: '/seller/quotations', icon: FileText },
    { name: 'My Quotations', path: '/seller/my-quotations', icon: Package },
    { name: 'Orders', path: '/seller/orders', icon: Clock },
    { name: 'Analytics', path: '/seller/analytics', icon: BarChart3 },
    { name: 'Profile', path: '/seller/profile', icon: User }, // Added Profile link
  ];

  const handleLogout = () => {
    localStorage.removeItem('seller_token');
    localStorage.removeItem('user');
    navigate('/seller/login');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100 dark:bg-gray-950 font-inter">
      {/* Mobile Header */}
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-white dark:bg-gray-900 px-4 md:px-6 lg:hidden z-10">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col bg-white dark:bg-gray-900">
            <nav className="grid gap-2 text-lg font-medium mt-6">
              <Link to="/seller/dashboard" className="flex items-center gap-2 text-lg font-semibold mb-4">
                <DollarSign className="h-6 w-6 text-seller-accent" />
                <span className="text-seller-primary">{sellerName}</span>
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                    location.pathname.startsWith(item.path) && "bg-muted text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex items-center justify-between p-4 border-t">
              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600">
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full shadow-md ml-2"
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5 text-purple-600" />
                ) : (
                  <Sun className="h-5 w-5 text-yellow-500" />
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <Link to="/seller/dashboard" className="flex items-center gap-2 text-lg font-semibold">
          <DollarSign className="h-6 w-6 text-seller-accent" />
          <span className="text-seller-primary">{sellerName}</span>
        </Link>
        <div className="ml-auto">
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
            <span className="sr-only">User menu</span>
          </Button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="flex">
        <aside className="hidden lg:flex w-[240px] flex-col border-r bg-white dark:bg-gray-900 h-screen sticky top-0">
          <div className="flex h-16 items-center border-b px-6 justify-between">
            <Link to="/seller/dashboard" className="flex items-center gap-2 font-semibold">
              <DollarSign className="h-6 w-6 text-seller-accent" />
              <span className="text-seller-primary">{sellerName}</span>
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full shadow-md"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-purple-600" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-500" />
              )}
            </Button>
          </div>
          <nav className="flex-1 overflow-auto py-4 px-4">
            <ul className="grid gap-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                      location.pathname.startsWith(item.path) && "bg-muted text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto p-4 border-t">
            <Button onClick={handleLogout} variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 border-red-500">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* ✅ Toast container goes here */}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
};

export default SellerLayout;

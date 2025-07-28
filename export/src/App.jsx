import React from 'react';
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Index from "./pages/Index";
import CardExpand from "./pages/shared/CardExpand.jsx"

import BuyerLogin from "./pages/auth/BuyerLogin";
import BuyerRegister from "./pages/auth/BuyerRegister";
import SellerLogin from "./pages/auth/SellerLogin";
import SellerRegister from "./pages/auth/SellerRegister";
import AdminLogin from "./pages/auth/AdminLogin";

import BuyerDashboard from "./pages/buyer/BuyerDashboard";
// CORRECTED: Import with uppercase 'Address'
import Address from "@/pages/buyer/Address.jsx"; // Ensure this path is correct
import Cart from "@/pages/buyer/Cart.jsx"; // Ensure this path is correct

import MyOrders from "@/pages/buyer/MyOrders.jsx";
import SellerDashboard from "./pages/seller/SellerDashboard";
import QuotationManagement from "./pages/seller/QuotationManagement";
import MyQuotations from "./pages/seller/MyQuotations";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerOrderDetails from "./pages/seller/SellerOrderDetails";
import SellerAnalytics from "./pages/seller/SellerAnalytics";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductManagement from "./pages/admin/ProductManagement";
import UserManagement from "./pages/admin/UserManagement";
import AddProfile from "./pages/admin/AddProfile";
import QuotationChat from "./pages/shared/QuotationChat";
import BuyerProfile from "@/pages/shared/BuyerProfile.jsx";
import ProfilePage from "./pages/shared/ProfilePage";

import SellerLayout from './pages/seller/SellerLayout';
const queryClient = new QueryClient();

// Simple authentication check
const isAuthenticatedSeller = () => {
  return localStorage.getItem('seller_token') !== null;
};

// Private route for sellers
const PrivateRoute = ({ children }) => {
  if (!isAuthenticatedSeller()) {
    return <Navigate to="/seller/login" replace />;
  }
  return children;
};

const App = () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/CardExpand" element={<CardExpand />} />

            {/* Auth Routes */}
            <Route path="/buyer/login" element={<BuyerLogin />} />
            <Route path="/buyer/register" element={<BuyerRegister />} />
            <Route path="/seller/login" element={<SellerLogin />} />
            <Route path="/seller/register" element={<SellerRegister />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Buyer Routes */}
            <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
            {/* CORRECTED: Use uppercase 'Address' component */}
            <Route path="/buyer/address" element={<Address />} />
            <Route path="/buyer/cart" element={<Cart />} />
            <Route path="/buyer/orders" element={<MyOrders />} />
            <Route path="/buyer/profile" element={<BuyerProfile />} />

            {/* Seller Routes - Protected */}
            <Route path="/seller/*" element={<PrivateRoute><SellerLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SellerDashboard />} />
              <Route path="quotations" element={<QuotationManagement />} />
              <Route path="my-quotations" element={<MyQuotations />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="orders/:orderId/details" element={<SellerOrderDetails />} />
              <Route path="analytics" element={<SellerAnalytics />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<ProductManagement />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/profile" element={<AddProfile />} />

            {/* Shared Routes */}
            {/* <Route path="/chat" element={<QuotationChat />} /> */}


            {/* Catch-all */}
            {/* You might want a 404 page here */}
            <Route path="*" element={<div className="p-8 text-center text-2xl text-red-500">404: Page Not Found</div>} />

          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
);

export default App;

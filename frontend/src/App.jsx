import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import BuyerLayout from './layouts/BuyerLayout';
import OwnerLayout from './layouts/OwnerLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Buyer Pages
import Home from './pages/buyer/Home';
import ProductDetails from './pages/buyer/ProductDetails';
import Cart from './pages/buyer/Cart';
import Checkout from './pages/buyer/Checkout';
import OrderTracking from './pages/buyer/OrderTracking';
import OrderHistory from './pages/buyer/OrderHistory';
import Profile from './pages/buyer/Profile';

// Owner Pages
import Dashboard from './pages/owner/Dashboard';
import Products from './pages/owner/Products';
import AddProduct from './pages/owner/AddProduct';
import NearbyOrders from './pages/owner/NearbyOrders';
import MyOrders from './pages/owner/MyOrders';
import Analytics from './pages/owner/Analytics';
import OwnerProfile from './pages/owner/OwnerProfile';

// Global Styles
import './styles/global.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            <Routes>
              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Buyer Routes */}
              <Route element={<BuyerLayout />}>
                <Route path="/buyer" element={<Home />} />
                <Route path="/buyer/product/:id" element={<ProductDetails />} />
                <Route path="/buyer/cart" element={<Cart />} />
                <Route path="/buyer/checkout" element={<Checkout />} />
                <Route path="/buyer/tracking/:orderId" element={<OrderTracking />} />
                <Route path="/buyer/orders" element={<OrderHistory />} />
                <Route path="/buyer/profile" element={<Profile />} />
              </Route>

              {/* Owner Routes */}
              <Route element={<OwnerLayout />}>
                <Route path="/owner" element={<Dashboard />} />
                <Route path="/owner/products" element={<Products />} />
                <Route path="/owner/products/add" element={<AddProduct />} />
                <Route path="/owner/products/edit/:id" element={<AddProduct />} />
                <Route path="/owner/nearby-orders" element={<NearbyOrders />} />
                <Route path="/owner/my-orders" element={<MyOrders />} />
                <Route path="/owner/analytics" element={<Analytics />} />
                <Route path="/owner/profile" element={<OwnerProfile />} />
              </Route>

              {/* Default Route */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </OrderProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
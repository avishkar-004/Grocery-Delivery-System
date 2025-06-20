import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BuyerLogin from "./pages/auth/BuyerLogin";
import BuyerRegister from "./pages/auth/BuyerRegister";
import SellerLogin from "./pages/auth/SellerLogin";
import SellerRegister from "./pages/auth/SellerRegister";
import AdminLogin from "./pages/auth/AdminLogin";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import Cart from "./pages/buyer/Cart";
import Orders from "./pages/buyer/Orders";
import QuotationResponses from "./pages/buyer/QuotationResponses";
import SellerDashboard from "./pages/seller/SellerDashboard";
import QuotationManagement from "./pages/seller/QuotationManagement";
import MyQuotations from "./pages/seller/MyQuotations";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductManagement from "./pages/admin/ProductManagement";
import UserManagement from "./pages/admin/UserManagement";
import Analytics from "./pages/seller/Analytics";
import QuotationChat from "./pages/shared/QuotationChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Auth Routes */}
          <Route path="/buyer/login" element={<BuyerLogin />} />
          <Route path="/buyer/register" element={<BuyerRegister />} />
          <Route path="/seller/login" element={<SellerLogin />} />
          <Route path="/seller/register" element={<SellerRegister />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Buyer Routes */}
          <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
          <Route path="/buyer/cart" element={<Cart />} />
          <Route path="/buyer/orders" element={<Orders />} />
          <Route path="/buyer/quotation-responses" element={<QuotationResponses />} />

          {/* Seller Routes */}
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/quotations" element={<QuotationManagement />} />
          <Route path="/seller/my-quotations" element={<MyQuotations />} />
          <Route path="/seller/analytics" element={<Analytics />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />

          {/* Shared Routes */}
          {/* <Route path="/chat" element={<QuotationChat />} /> */}

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
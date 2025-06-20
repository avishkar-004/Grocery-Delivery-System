
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { ShoppingCart, User, Store } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with mesh gradient */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-10 animate-pulse-slow"></div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-gradient-start to-gradient-end rounded-full opacity-20 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-r from-gradient-end to-gradient-start rounded-full opacity-15 animate-float" style={{animationDelay: '1s'}}></div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 animate-fade-in">
          <span className="gradient-text">Fresh</span>
          <span className="text-foreground">Market</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-slide-up">
          Connect buyers with sellers in the ultimate grocery marketplace. 
          Fresh products, competitive prices, seamless experience.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {/* Buyer Card */}
          <div className="glass-card p-8 hover-lift glow-effect group">
            <div className="w-16 h-16 bg-gradient-to-r from-buyer-accent to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">For Buyers</h3>
            <p className="text-muted-foreground mb-6">
              Browse fresh groceries, compare prices, and get the best deals from multiple sellers.
            </p>
            <div className="space-y-3">
              <Link to="/buyer/login" className="block">
                <Button className="w-full bg-gradient-to-r from-buyer-accent to-blue-600 hover:from-blue-600 hover:to-buyer-accent transition-all duration-300">
                  Login as Buyer
                </Button>
              </Link>
              <Link to="/buyer/register" className="block">
                <Button variant="outline" className="w-full hover-lift">
                  Register as Buyer
                </Button>
              </Link>
            </div>
          </div>

          {/* Seller Card */}
          <div className="glass-card p-8 hover-lift glow-effect group">
            <div className="w-16 h-16 bg-gradient-to-r from-seller-accent to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">For Sellers</h3>
            <p className="text-muted-foreground mb-6">
              Manage your inventory, respond to orders, and grow your grocery business online.
            </p>
            <div className="space-y-3">
              <Link to="/seller/login" className="block">
                <Button className="w-full bg-gradient-to-r from-seller-accent to-orange-600 hover:from-orange-600 hover:to-seller-accent transition-all duration-300">
                  Login as Seller
                </Button>
              </Link>
              <Link to="/seller/register" className="block">
                <Button variant="outline" className="w-full hover-lift">
                  Register as Seller
                </Button>
              </Link>
            </div>
          </div>

          {/* Admin Card */}
          <div className="glass-card p-8 hover-lift glow-effect group">
            <div className="w-16 h-16 bg-gradient-to-r from-admin-accent to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <User className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Administration</h3>
            <p className="text-muted-foreground mb-6">
              Manage the platform, oversee transactions, and maintain marketplace quality.
            </p>
            <div className="space-y-3">
              <Link to="/admin/login" className="block">
                <Button className="w-full bg-gradient-to-r from-admin-accent to-purple-600 hover:from-purple-600 hover:to-admin-accent transition-all duration-300">
                  Admin Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

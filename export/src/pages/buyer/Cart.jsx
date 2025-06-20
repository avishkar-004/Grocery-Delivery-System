import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([
    {
      id: "1",
      name: "Basmati Rice",
      category: "Grains & Flours",
      quantity: 2,
      unit: "kg",
      description: "Premium quality basmati rice"
    },
    {
      id: "2",
      name: "Turmeric Powder",
      category: "Spices & Masalas",
      quantity: 1,
      unit: "250g",
      description: "Pure turmeric powder"
    }
  ]);
  
  const [cartName, setCartName] = useState("");

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
    toast({
      title: "Item Removed",
      description: "Item has been removed from your cart",
    });
  };

  const proceedToCheckout = () => {
    if (!cartName.trim()) {
      toast({
        title: "Cart Name Required",
        description: "Please enter a name for your quotation",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add items to your cart before proceeding",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Proceeding to Checkout",
      description: "Redirecting to address selection...",
    });
    
    // Navigate to orders page (will be created)
    navigate("/buyer/orders");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/buyer/dashboard">
              <Button variant="ghost" size="icon" className="hover-lift">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold gradient-text">My Cart</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {cartItems.length} items
            </Badge>
            <Button variant="ghost" size="icon" className="hover-lift">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl">Cart Items</CardTitle>
                <CardDescription>
                  Review and modify your selected items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">Your cart is empty</p>
                    <Link to="/buyer/dashboard">
                      <Button className="mt-4 bg-gradient-to-r from-buyer-accent to-blue-600 hover:from-blue-600 hover:to-buyer-accent">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="glass-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <p className="text-muted-foreground text-sm">{item.description}</p>
                          <Badge variant="outline" className="mt-2">
                            {item.category}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="text-center">
                            <p className="font-medium">{item.unit}</p>
                            <p className="text-xs text-muted-foreground">per unit</p>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 hover:border-red-500 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cart Summary */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Quotation Details</CardTitle>
                <CardDescription>
                  Name your cart for easy tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cart-name">Quotation Name *</Label>
                  <Input
                    id="cart-name"
                    placeholder="e.g., Weekly Groceries, Party Supplies"
                    value={cartName}
                    onChange={(e) => setCartName(e.target.value)}
                    className="border-2 focus:border-buyer-accent transition-colors"
                  />
                  <p className="text-xs text-muted-foreground">
                    This name will help you identify this quotation in your orders
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span className="font-medium">{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity:</span>
                    <span className="font-medium">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)} units
                    </span>
                  </div>
                </div>

                <Button
                  onClick={proceedToCheckout}
                  className="w-full h-12 bg-gradient-to-r from-buyer-accent to-blue-600 hover:from-blue-600 hover:to-buyer-accent transition-all duration-300 text-white font-semibold"
                  disabled={cartItems.length === 0}
                >
                  Proceed to Request Quotations
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Your request will be sent to multiple sellers for competitive pricing
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-buyer-accent text-white flex items-center justify-center text-xs font-bold">1</div>
                  <p>Submit your quotation request</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-buyer-accent text-white flex items-center justify-center text-xs font-bold">2</div>
                  <p>Multiple sellers will respond with prices</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-buyer-accent text-white flex items-center justify-center text-xs font-bold">3</div>
                  <p>Compare and choose the best offer</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-buyer-accent text-white flex items-center justify-center text-xs font-bold">4</div>
                  <p>Complete your order with selected seller</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, User, Plus, ArrowLeft } from "lucide-react";
import { productsTable, categories } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const BuyerDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);

  const filteredProducts = productsTable.filter(product => {
    const matchesSearch = product.prod_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    setCart(prev => [...prev, product]);
    toast({
      title: "Added to Cart",
      description: `${product.prod_name} has been added to your cart`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="hover-lift">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold gradient-text">Buyer Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/buyer/cart">
              <Badge variant="secondary" className="text-sm cursor-pointer hover-lift">
                <ShoppingCart className="h-4 w-4 mr-2" />
                {cart.length} items
              </Badge>
            </Link>
            <Link to="/buyer/orders">
              <Button variant="ghost" className="hover-lift">
                My Orders
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="hover-lift">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Browse Products</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-10 border-2 focus:border-buyer-accent transition-colors"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-64 h-12 border-2 focus:border-buyer-accent">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {categories.map((category, index) => {
            const categoryIcons = ["🧂", "🌾", "🍛", "🫙", "🥫", "🍭", "🍵", "🍽️", "🍃", "🛍️", "🧴"];
            return (
              <Card 
                key={category}
                className="glass-card hover-lift glow-effect cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{categoryIcons[index]}</div>
                  <h3 className="font-semibold text-sm">{category}</h3>
                  <p className="text-xs text-muted-foreground mt-2">
                    {productsTable.filter(p => p.category === category).length} products
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">
              {selectedCategory === "all" ? "All Products" : selectedCategory}
            </h3>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {filteredProducts.length} products found
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <Card key={index} className="glass-card hover-lift">
                <CardHeader>
                  <div className="w-full h-40 bg-gradient-to-br from-gradient-start/20 to-gradient-end/20 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-4xl">🛒</span>
                  </div>
                  <CardTitle className="text-lg">{product.prod_name}</CardTitle>
                  <CardDescription className="text-sm">
                    {product.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                    <Button
                      onClick={() => addToCart(product)}
                      size="sm"
                      className="bg-gradient-to-r from-buyer-accent to-blue-600 hover:from-blue-600 hover:to-buyer-accent transition-all duration-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;
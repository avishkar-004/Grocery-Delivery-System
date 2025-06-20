import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, User, MessageSquare, Check, X, Eye, Store, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const QuotationResponses = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "ORD001";
  
  const [responses, setResponses] = useState([
    {
      id: "QUO001",
      sellerId: "SEL001",
      sellerName: "Fresh Mart Store",
      distance: "2.5 km",
      totalAmount: 570,
      availableItems: 3,
      unavailableItems: 0,
      status: "pending",
      responseDate: "2024-01-15",
      items: [
        { name: "Turmeric Powder", quantity: "500g", pricePerUnit: 120, available: true, totalPrice: 120 },
        { name: "Basmati Rice", quantity: "5kg", pricePerUnit: 90, available: true, totalPrice: 450 },
        { name: "Red Lentils", quantity: "2kg", pricePerUnit: 80, available: true, totalPrice: 160 }
      ],
      discount: 50
    },
    {
      id: "QUO002",
      sellerId: "SEL002",
      sellerName: "Organic Store",
      distance: "3.2 km",
      totalAmount: 620,
      availableItems: 2,
      unavailableItems: 1,
      status: "pending",
      responseDate: "2024-01-15",
      items: [
        { name: "Turmeric Powder", quantity: "500g", pricePerUnit: 150, available: true, totalPrice: 150 },
        { name: "Basmati Rice", quantity: "5kg", pricePerUnit: 95, available: true, totalPrice: 475 },
        { name: "Red Lentils", quantity: "2kg", pricePerUnit: 0, available: false, totalPrice: 0 }
      ],
      discount: 5
    },
    {
      id: "QUO003",
      sellerId: "SEL003",
      sellerName: "City Grocery",
      distance: "1.8 km",
      totalAmount: 600,
      availableItems: 3,
      unavailableItems: 0,
      status: "pending",
      responseDate: "2024-01-16",
      items: [
        { name: "Turmeric Powder", quantity: "500g", pricePerUnit: 125, available: true, totalPrice: 125 },
        { name: "Basmati Rice", quantity: "5kg", pricePerUnit: 85, available: true, totalPrice: 425 },
        { name: "Red Lentils", quantity: "2kg", pricePerUnit: 75, available: true, totalPrice: 150 }
      ],
      discount: 100
    }
  ]);

  const [selectedResponse, setSelectedResponse] = useState(null);

  const handleAcceptQuotation = (responseId) => {
    setResponses(responses.map(response => 
      response.id === responseId 
        ? { ...response, status: "accepted" }
        : { ...response, status: "rejected" }
    ));
    
    const acceptedResponse = responses.find(r => r.id === responseId);
    toast({
      title: "Quotation Accepted!",
      description: `You have accepted the quotation from ${acceptedResponse?.sellerName}`,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-orange-500";
      case "accepted": return "bg-green-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getPriceComparison = () => {
    const prices = responses.map(r => r.totalAmount);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return { minPrice, maxPrice };
  };

  const { minPrice, maxPrice } = getPriceComparison();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/buyer/orders">
              <Button variant="ghost" size="icon" className="hover-lift">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold gradient-text">Quotation Responses</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              Order #{orderId}
            </Badge>
            <Button variant="ghost" size="icon" className="hover-lift">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Price Comparison Summary */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Price Comparison Summary</CardTitle>
            <CardDescription>
              Compare quotations from {responses.length} sellers for order #{orderId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">₹{minPrice}</p>
                <p className="text-sm text-muted-foreground">Lowest Price</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">₹{maxPrice}</p>
                <p className="text-sm text-muted-foreground">Highest Price</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-buyer-accent">₹{maxPrice - minPrice}</p>
                <p className="text-sm text-muted-foreground">Price Difference</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quotation Responses */}
        <div className="space-y-6">
          {responses.map((response) => (
            <Card key={response.id} className="glass-card hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Store className="h-8 w-8 text-buyer-accent" />
                    <div>
                      <CardTitle className="text-lg">{response.sellerName}</CardTitle>
                      <CardDescription className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {response.distance} • Response Date: {response.responseDate}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-buyer-accent">₹{response.totalAmount}</div>
                    <Badge className={`${getStatusColor(response.status)} text-white mt-2`}>
                      {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex space-x-6">
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{response.availableItems} Available</span>
                      </div>
                      {response.unavailableItems > 0 && (
                        <div className="flex items-center space-x-2">
                          <X className="h-4 w-4 text-red-500" />
                          <span className="text-sm">{response.unavailableItems} Unavailable</span>
                        </div>
                      )}
                    </div>
                    {response.discount > 0 && (
                      <p className="text-sm text-green-600 font-medium">
                        Discount Applied: ₹{response.discount}
                      </p>
                    )}
                    <div className="flex items-center space-x-2">
                      {response.totalAmount === minPrice && (
                        <Badge variant="default" className="bg-green-500 text-white text-xs">
                          Best Price
                        </Badge>
                      )}
                      {response.unavailableItems === 0 && (
                        <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                          All Items Available
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedResponse(response)}
                          className="hover:border-buyer-accent"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Quotation Details - {response.sellerName}</DialogTitle>
                          <DialogDescription>
                            Detailed breakdown of the quotation
                          </DialogDescription>
                        </DialogHeader>
                        {selectedResponse && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="font-medium text-sm">Seller</p>
                                <p className="text-sm text-muted-foreground">{selectedResponse.sellerName}</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm">Distance</p>
                                <p className="text-sm text-muted-foreground">{selectedResponse.distance}</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm">Response Date</p>
                                <p className="text-sm text-muted-foreground">{selectedResponse.responseDate}</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm">Total Amount</p>
                                <p className="text-sm text-muted-foreground">₹{selectedResponse.totalAmount}</p>
                              </div>
                            </div>
                            
                            <div className="glass-card p-4">
                              <h4 className="font-medium mb-2">Item Details</h4>
                              <div className="space-y-2">
                                {selectedResponse.items.map((item, index) => (
                                  <div key={index} className="flex justify-between items-center text-sm border-b pb-2">
                                    <div>
                                      <span className="font-medium">{item.name}</span>
                                      <span className="text-muted-foreground ml-2">({item.quantity})</span>
                                    </div>
                                    <div className="text-right">
                                      {item.available ? (
                                        <div>
                                          <div>₹{item.pricePerUnit} per unit</div>
                                          <div className="font-medium">₹{item.totalPrice}</div>
                                        </div>
                                      ) : (
                                        <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="mt-4 pt-2 border-t">
                                <div className="flex justify-between text-sm">
                                  <span>Subtotal:</span>
                                  <span>₹{selectedResponse.items.filter(item => item.available).reduce((sum, item) => sum + item.totalPrice, 0)}</span>
                                </div>
                                {selectedResponse.discount > 0 && (
                                  <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount:</span>
                                    <span>-₹{selectedResponse.discount}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-lg font-bold mt-2">
                                  <span>Total:</span>
                                  <span>₹{selectedResponse.totalAmount}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Link to={`/chat?quotationId=${response.id}&userType=buyer`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:border-buyer-accent"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </Link>
                    
                    {response.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleAcceptQuotation(response.id)}
                        className="bg-gradient-to-r from-buyer-accent to-blue-600 hover:from-blue-600 hover:to-buyer-accent"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuotationResponses;
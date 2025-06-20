import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Search, MessageSquare, User, Edit, Eye, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const MyQuotations = () => {
  const [quotations, setQuotations] = useState([
    {
      id: "QUO001",
      orderId: "ORD001",
      buyerName: "John Doe",
      totalAmount: 570,
      availableItems: 3,
      unavailableItems: 0,
      status: "pending",
      sentDate: "2024-01-15",
      items: [
        { name: "Turmeric Powder", quantity: "500g", pricePerUnit: 120, available: true, totalPrice: 120 },
        { name: "Basmati Rice", quantity: "5kg", pricePerUnit: 90, available: true, totalPrice: 450 },
        { name: "Red Lentils", quantity: "2kg", pricePerUnit: 80, available: true, totalPrice: 160 }
      ]
    },
    {
      id: "QUO002",
      orderId: "ORD002",
      buyerName: "Jane Smith",
      totalAmount: 630,
      availableItems: 2,
      unavailableItems: 0,
      status: "accepted",
      sentDate: "2024-01-14",
      items: [
        { name: "Coconut Oil", quantity: "1L", pricePerUnit: 280, available: true, totalPrice: 280 },
        { name: "Almonds", quantity: "500g", pricePerUnit: 700, available: true, totalPrice: 350 }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = quotation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || quotation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-orange-500";
      case "accepted": return "bg-green-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const handleEditQuotation = (quotationId) => {
    toast({
      title: "Edit Quotation",
      description: "Edit functionality will be implemented here",
    });
  };

  const handleDeleteQuotation = (quotationId) => {
    setQuotations(quotations.filter(q => q.id !== quotationId));
    toast({
      title: "Quotation Deleted",
      description: "The quotation has been removed successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/seller/dashboard">
              <Button variant="ghost" size="icon" className="hover-lift">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold gradient-text">My Quotations</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              {filteredQuotations.length} quotations
            </Badge>
            <Button variant="ghost" size="icon" className="hover-lift">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Filter Quotations</CardTitle>
            <CardDescription>
              Search and filter your sent quotations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by quotation ID, order ID, or buyer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pl-10 border-2 focus:border-seller-accent transition-colors"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 h-12 border-2 focus:border-seller-accent">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quotations List */}
        <div className="space-y-6">
          {filteredQuotations.map((quotation) => (
            <Card key={quotation.id} className="glass-card hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Quotation #{quotation.id}</CardTitle>
                    <CardDescription>
                      Order #{quotation.orderId} • {quotation.sentDate} • Total: ₹{quotation.totalAmount}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(quotation.status)} text-white`}>
                    {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Buyer:</span> {quotation.buyerName}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Available Items:</span> {quotation.availableItems}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Unavailable Items:</span> {quotation.unavailableItems}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedQuotation(quotation)}
                          className="hover:border-seller-accent"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Quotation Details - #{quotation.id}</DialogTitle>
                          <DialogDescription>
                            Complete information about your quotation
                          </DialogDescription>
                        </DialogHeader>
                        {selectedQuotation && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="font-medium text-sm">Order ID</p>
                                <p className="text-sm text-muted-foreground">{selectedQuotation.orderId}</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm">Buyer</p>
                                <p className="text-sm text-muted-foreground">{selectedQuotation.buyerName}</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm">Sent Date</p>
                                <p className="text-sm text-muted-foreground">{selectedQuotation.sentDate}</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm">Total Amount</p>
                                <p className="text-sm text-muted-foreground">₹{selectedQuotation.totalAmount}</p>
                              </div>
                            </div>
                            
                            <div className="glass-card p-4">
                              <h4 className="font-medium mb-2">Quotation Items</h4>
                              <div className="space-y-2">
                                {selectedQuotation.items.map((item, index) => (
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
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    {quotation.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuotation(quotation.id)}
                          className="hover:border-seller-accent"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuotation(quotation.id)}
                          className="hover:border-red-500 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </>
                    )}
                    
                    <Link to={`/chat?quotationId=${quotation.id}&userType=seller`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:border-seller-accent"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </Link>
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

export default MyQuotations;
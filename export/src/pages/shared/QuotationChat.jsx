import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, User, Store, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const QuotationChat = () => {
  const [searchParams] = useSearchParams();
  const quotationId = searchParams.get("quotationId") || "QUO001";
  const userType = searchParams.get("userType") || "buyer";
  
  const [messages, setMessages] = useState([
    {
      id: "MSG001",
      senderId: "buyer123",
      senderName: "John Doe",
      senderType: "buyer",
      content: "Hi! I'm interested in your quotation. Can you confirm the delivery date?",
      timestamp: "2024-01-15 10:30 AM",
      read: true
    },
    {
      id: "MSG002",
      senderId: "seller456",
      senderName: "Fresh Mart Store",
      senderType: "seller",
      content: "Hello! Thank you for your interest. We can deliver within 2-3 business days. All items in your order are currently in stock.",
      timestamp: "2024-01-15 11:15 AM",
      read: true
    },
    {
      id: "MSG003",
      senderId: "buyer123",
      senderName: "John Doe",
      senderType: "buyer",
      content: "That sounds perfect! Is there any flexibility on the pricing for bulk orders?",
      timestamp: "2024-01-15 11:45 AM",
      read: true
    },
    {
      id: "MSG004",
      senderId: "seller456",
      senderName: "Fresh Mart Store",
      senderType: "seller",
      content: "For orders above ₹1000, we offer a 5% discount. Your current order qualifies for this discount!",
      timestamp: "2024-01-15 12:20 PM",
      read: false
    }
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [chatDisabled, setChatDisabled] = useState(false);

  const quotationDetails = {
    id: quotationId,
    buyerName: "John Doe",
    sellerName: "Fresh Mart Store",
    status: "pending",
    totalAmount: 1250,
    items: 3
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: `MSG${Date.now()}`,
      senderId: userType === "buyer" ? "buyer123" : "seller456",
      senderName: userType === "buyer" ? "John Doe" : "Fresh Mart Store",
      senderType: userType,
      content: newMessage,
      timestamp: new Date().toLocaleString(),
      read: false
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
    
    toast({
      title: "Message Sent",
      description: "Your message has been delivered successfully.",
    });
  };

  const getBackLink = () => {
    if (userType === "buyer") {
      return "/buyer/quotation-responses";
    }
    return "/seller/my-quotations";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to={getBackLink()}>
              <Button variant="ghost" size="icon" className="hover-lift">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold gradient-text">Quotation Chat</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              {quotationId}
            </Badge>
            <Button variant="ghost" size="icon" className="hover-lift">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Quotation Summary */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Quotation Details</CardTitle>
            <CardDescription>
              Conversation between buyer and seller for quotation #{quotationId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-buyer-accent" />
                <div>
                  <p className="text-sm font-medium">Buyer</p>
                  <p className="text-sm text-muted-foreground">{quotationDetails.buyerName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Store className="h-4 w-4 text-seller-accent" />
                <div>
                  <p className="text-sm font-medium">Seller</p>
                  <p className="text-sm text-muted-foreground">{quotationDetails.sellerName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Total Amount</p>
                <p className="text-sm text-muted-foreground">₹{quotationDetails.totalAmount}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge className="bg-orange-500 text-white">
                  {quotationDetails.status.charAt(0).toUpperCase() + quotationDetails.status.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Messages</span>
              {chatDisabled && (
                <Badge variant="destructive">Chat Disabled</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Messages */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderType === userType ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-sm lg:max-w-md px-4 py-3 rounded-lg ${
                      message.senderType === userType
                        ? 'bg-gradient-to-r from-buyer-accent to-blue-600 text-white'
                        : 'glass-card'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {message.senderType === "buyer" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Store className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">{message.senderName}</span>
                      {message.read && message.senderType === userType && (
                        <CheckCircle className="h-3 w-3" />
                      )}
                    </div>
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-75 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            {!chatDisabled ? (
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 border-2 focus:border-buyer-accent"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-buyer-accent to-blue-600 hover:from-blue-600 hover:to-buyer-accent"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center p-4 glass-card rounded-lg">
                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Chat has been disabled for this quotation
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Actions */}
        {userType === "buyer" && !chatDisabled && (
          <Card className="glass-card mt-6">
            <CardContent className="pt-6">
              <div className="flex space-x-4">
                <Button 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  onClick={() => {
                    setChatDisabled(true);
                    toast({
                      title: "Quotation Accepted!",
                      description: "Chat will be disabled for other sellers.",
                    });
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Quotation
                </Button>
                <Button 
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  onClick={() => {
                    setChatDisabled(true);
                    toast({
                      title: "Quotation Rejected",
                      description: "Chat has been disabled for this quotation.",
                    });
                  }}
                >
                  Reject Quotation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuotationChat;
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SellerRegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    contact: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    coordinates: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Simulate registration
    setTimeout(() => {
      toast({
        title: "Registration Successful!",
        description: "Your seller account has been created. Please login.",
      });
      navigate("/seller/login");
    }, 1500);
  };

  const simulateLocationPicker = () => {
    const coords = `${(Math.random() * 180 - 90).toFixed(6)}, ${(Math.random() * 360 - 180).toFixed(6)}`;
    handleInputChange("coordinates", coords);
    toast({
      title: "Location Selected",
      description: `Coordinates: ${coords}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Link to="/" className="absolute top-6 left-6">
        <Button variant="ghost" className="hover-lift">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </Link>

      <Card className="glass-card w-full max-w-2xl hover-lift">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-seller-accent to-orange-600 rounded-full flex items-center justify-center mx-auto">
            <Store className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Join as Seller</CardTitle>
          <CardDescription className="text-lg">
            Create your seller account and start your business
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  className="border-2 focus:border-seller-accent transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  placeholder="Phone number"
                  value={formData.contact}
                  onChange={(e) => handleInputChange("contact", e.target.value)}
                  required
                  className="border-2 focus:border-seller-accent transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className="border-2 focus:border-seller-accent transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={(value) => handleInputChange("gender", value)}>
                  <SelectTrigger className="border-2 focus:border-seller-accent">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  required
                  className="border-2 focus:border-seller-accent transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address</Label>
              <Textarea
                id="address"
                placeholder="Enter your complete business address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                required
                className="border-2 focus:border-seller-accent transition-colors min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordinates">Location Coordinates</Label>
              <div className="flex gap-2">
                <Input
                  id="coordinates"
                  placeholder="Select location on map"
                  value={formData.coordinates}
                  readOnly
                  className="border-2 focus:border-seller-accent transition-colors"
                />
                <Button
                  type="button"
                  onClick={simulateLocationPicker}
                  variant="outline"
                  className="border-2 border-seller-accent text-seller-accent hover:bg-seller-accent hover:text-white"
                >
                  Pick Location
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  className="border-2 focus:border-seller-accent transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                  className="border-2 focus:border-seller-accent transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-seller-accent to-orange-600 hover:from-orange-600 hover:to-seller-accent transition-all duration-300 text-white font-semibold"
            >
              {isLoading ? "Creating Account..." : "Create Seller Account"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/seller/login" className="text-seller-accent hover:text-orange-600 font-medium hover:underline">
                Sign in here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerRegister;
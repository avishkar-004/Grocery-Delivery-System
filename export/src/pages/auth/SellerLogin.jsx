import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SellerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login validation
    if (email === "root@gmail.com" && password === "root@1234") {
      toast({
        title: "Login Successful!",
        description: "Welcome to your seller dashboard.",
      });
      navigate("/seller/dashboard");
    } else {
      toast({
        title: "Invalid Credentials",
        description: "Please check your email and password.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Link to="/" className="absolute top-6 left-6">
        <Button variant="ghost" className="hover-lift">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </Link>

      <Card className="glass-card w-full max-w-md hover-lift">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-seller-accent to-orange-600 rounded-full flex items-center justify-center mx-auto">
            <Store className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Seller Login</CardTitle>
          <CardDescription className="text-lg">
            Access your seller dashboard and manage orders
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-2 focus:border-seller-accent transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-2 focus:border-seller-accent transition-colors"
              />
            </div>

            <div className="text-sm text-muted-foreground text-center">
              Test credentials: <strong>root@gmail.com</strong> / <strong>root@1234</strong>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-seller-accent to-orange-600 hover:from-orange-600 hover:to-seller-accent transition-all duration-300 text-white font-semibold"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="text-center space-y-2">
              <Button variant="link" className="text-seller-accent hover:text-orange-600">
                Forgot Password?
              </Button>
              <div className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/seller/register" className="text-seller-accent hover:text-orange-600 font-medium hover:underline">
                  Register here
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerLogin;
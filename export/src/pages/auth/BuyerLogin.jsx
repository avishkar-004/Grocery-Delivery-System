import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const BuyerLogin = () => {
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
        description: "Welcome to your buyer dashboard.",
      });
      navigate("/buyer/dashboard");
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
      {/* Back button */}
      <Link to="/" className="absolute top-6 left-6">
        <Button variant="ghost" className="hover-lift">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </Link>

      <Card className="glass-card w-full max-w-md hover-lift">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-buyer-accent to-blue-600 rounded-full flex items-center justify-center mx-auto">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Buyer Login</CardTitle>
          <CardDescription className="text-lg">
            Sign in to browse and purchase groceries
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
                className="h-12 border-2 focus:border-buyer-accent transition-colors"
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
                className="h-12 border-2 focus:border-buyer-accent transition-colors"
              />
            </div>

            <div className="text-sm text-muted-foreground text-center">
              Test credentials: <strong>root@gmail.com</strong> / <strong>root@1234</strong>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-buyer-accent to-blue-600 hover:from-blue-600 hover:to-buyer-accent transition-all duration-300 text-white font-semibold"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="text-center space-y-2">
              <Button variant="link" className="text-buyer-accent hover:text-blue-600">
                Forgot Password?
              </Button>
              <div className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/buyer/register" className="text-buyer-accent hover:text-blue-600 font-medium hover:underline">
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

export default BuyerLogin;
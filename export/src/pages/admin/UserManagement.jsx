import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Users, UserCheck, UserX, User } from "lucide-react";
import { mockUsers } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const UserManagement = () => {
  const [buyers, setBuyers] = useState(mockUsers.buyers);
  const [sellers, setSellers] = useState(mockUsers.sellers);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const updateUserStatus = (userId, userType, newStatus) => {
    if (userType === "buyer") {
      setBuyers(buyers.map(buyer => 
        buyer.id.toString() === userId ? { ...buyer, status: newStatus } : buyer
      ));
    } else {
      setSellers(sellers.map(seller => 
        seller.id.toString() === userId ? { ...seller, status: newStatus } : seller
      ));
    }
    
    toast({
      title: "Status Updated",
      description: `User status changed to ${newStatus}`,
    });
  };

  const filteredUsers = () => {
    let allUsers = [];
    
    if (filterType === "all" || filterType === "buyers") {
      allUsers = [...allUsers, ...buyers.map(buyer => ({ ...buyer, type: "buyer" }))];
    }
    if (filterType === "all" || filterType === "sellers") {
      allUsers = [...allUsers, ...sellers.map(seller => ({ ...seller, type: "seller" }))];
    }

    if (filterStatus !== "all") {
      allUsers = allUsers.filter(user => user.status === filterStatus);
    }

    if (searchTerm) {
      allUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return allUsers;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon" className="hover-lift">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold gradient-text">User Management</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              <User className="h-4 w-4 mr-2" />
              Administrator
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Buyers</CardTitle>
              <Users className="h-4 w-4 text-buyer-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-buyer-accent">{buyers.length}</div>
              <p className="text-xs text-muted-foreground">
                Active: {buyers.filter(b => b.status === "active").length}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sellers</CardTitle>
              <Users className="h-4 w-4 text-seller-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seller-accent">{sellers.length}</div>
              <p className="text-xs text-muted-foreground">
                Active: {sellers.filter(s => s.status === "active").length}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-admin-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-admin-accent">{buyers.length + sellers.length}</div>
              <p className="text-xs text-muted-foreground">
                All registered users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>User Filters</CardTitle>
            <CardDescription>Filter and search users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pl-10 border-2 focus:border-admin-accent transition-colors"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48 h-12 border-2 focus:border-admin-accent">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="buyers">Buyers Only</SelectItem>
                  <SelectItem value="sellers">Sellers Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48 h-12 border-2 focus:border-admin-accent">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers().map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.type === "buyer" ? "default" : "secondary"}>
                        {user.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.status === "active" ? "default" : "destructive"}
                        className={user.status === "active" ? "bg-green-500" : ""}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.location || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {user.status !== "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserStatus(user.id.toString(), user.type, "active")}
                            className="hover:border-green-500 hover:text-green-500"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Activate
                          </Button>
                        )}
                        {user.status !== "suspended" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserStatus(user.id.toString(), user.type, "suspended")}
                            className="hover:border-orange-500 hover:text-orange-500"
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        )}
                        {user.status !== "blocked" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserStatus(user.id.toString(), user.type, "blocked")}
                            className="hover:border-red-500 hover:text-red-500"
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Block
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Edit, Package, User } from "lucide-react";
import { productsTable, categories } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const ProductManagement = () => {
  const [products, setProducts] = useState(productsTable);
  const [productCategories, setProductCategories] = useState(categories);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ prod_name: "", category: "", desc: "" });
  const [newCategory, setNewCategory] = useState("");

  const addProduct = () => {
    if (!newProduct.prod_name || !newProduct.category || !newProduct.desc) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setProducts([...products, newProduct]);
    setNewProduct({ prod_name: "", category: "", desc: "" });
    setIsAddProductOpen(false);
    toast({
      title: "Success",
      description: "Product added successfully",
    });
  };

  const removeProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
    toast({
      title: "Success",
      description: "Product removed successfully",
    });
  };

  const addCategory = () => {
    if (!newCategory) {
      toast({
        title: "Error",
        description: "Please enter category name",
        variant: "destructive",
      });
      return;
    }

    setProductCategories([...productCategories, newCategory]);
    setNewCategory("");
    setIsAddCategoryOpen(false);
    toast({
      title: "Success",
      description: "Category added successfully",
    });
  };

  const removeCategory = (categoryToRemove) => {
    setProductCategories(productCategories.filter(cat => cat !== categoryToRemove));
    toast({
      title: "Success",
      description: "Category removed successfully",
    });
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
            <h1 className="text-2xl font-bold gradient-text">Product Management</h1>
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
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="glass-card hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center text-admin-accent">
                <Package className="h-5 w-5 mr-2" />
                Product Management
              </CardTitle>
              <CardDescription>
                Add, edit, or remove products from the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-to-r from-admin-accent to-purple-600 hover:from-purple-600 hover:to-admin-accent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new product
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="product-name">Product Name</Label>
                      <Input
                        id="product-name"
                        value={newProduct.prod_name}
                        onChange={(e) => setNewProduct({...newProduct, prod_name: e.target.value})}
                        placeholder="Enter product name"
                        className="focus:border-admin-accent"
                      />
                    </div>
                    <div>
                      <Label htmlFor="product-category">Category</Label>
                      <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                        <SelectTrigger className="focus:border-admin-accent">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {productCategories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="product-desc">Description</Label>
                      <Input
                        id="product-desc"
                        value={newProduct.desc}
                        onChange={(e) => setNewProduct({...newProduct, desc: e.target.value})}
                        placeholder="Enter product description"
                        className="focus:border-admin-accent"
                      />
                    </div>
                    <Button onClick={addProduct} className="w-full bg-admin-accent hover:bg-purple-600">
                      Add Product
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <p className="text-sm text-muted-foreground">
                Total Products: {products.length}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center text-admin-accent">
                <Package className="h-5 w-5 mr-2" />
                Category Management
              </CardTitle>
              <CardDescription>
                Add or remove product categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-to-r from-admin-accent to-purple-600 hover:from-purple-600 hover:to-admin-accent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Enter the name for the new category
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category-name">Category Name</Label>
                      <Input
                        id="category-name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Enter category name"
                        className="focus:border-admin-accent"
                      />
                    </div>
                    <Button onClick={addCategory} className="w-full bg-admin-accent hover:bg-purple-600">
                      Add Category
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <p className="text-sm text-muted-foreground">
                Total Categories: {productCategories.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>All Products</CardTitle>
            <CardDescription>
              Manage all products in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.prod_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>{product.desc}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" className="hover:border-admin-accent">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => removeProduct(index)}
                          className="hover:border-red-500 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Categories Management */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Manage product categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {productCategories.map((category, index) => (
                <div key={index} className="glass-card p-4 flex items-center justify-between">
                  <span className="font-medium">{category}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCategory(category)}
                    className="hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductManagement;
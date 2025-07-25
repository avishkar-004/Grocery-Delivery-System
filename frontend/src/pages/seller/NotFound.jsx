import React from 'react';
import { Link } from 'react-router-dom';
import { PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      <PackageX className="h-24 w-24 text-muted-foreground mb-6" />
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8 text-center">Oops! The page you're looking for doesn't exist.</p>
      <Link to="/seller/dashboard">
        <Button className="bg-seller-accent hover:bg-seller-accent/90">Go to Dashboard</Button>
      </Link>
    </div>
  );
};

export default NotFound;

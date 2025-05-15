# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



# Create React app
npx create-react-app grocery-delivery-frontend

# Navigate to frontend directory
cd grocery-delivery-frontend

# Install necessary packages
npm install axios react-router-dom @mui/material @mui/icons-material formik yup react-toastify mapbox-gl styled-components chart.js react-chartjs-2

🛒 Grocery Delivery System - Frontend
📋 Overview
A comprehensive grocery delivery system frontend built with React, featuring separate interfaces for buyers and shop owners.
🚀 Getting Started
Installation
bashnpm install axios react-router-dom @mui/material @mui/icons-material formik yup react-toastify mapbox-gl styled-components chart.js react-chartjs-2
📁 File Structure
Core Application Files

App.jsx - Main application component that handles routing and wraps the app with context providers
main.jsx - Entry point for the React application

Context Providers

AuthContext.jsx - Manages user authentication state, login/logout functionality, and user role information
CartContext.jsx - Manages shopping cart state, adding/removing items, and calculating totals
OrderContext.jsx - Manages order creation, fetching, and status updates

Layouts

AuthLayout.jsx - Layout for authentication pages with split-screen design

auth.css - Styling for the authentication layout


BuyerLayout.jsx - Layout wrapper for buyer pages with navbar and footer

buyer-layout.css - Styling for the buyer layout with subtle background pattern


OwnerLayout.jsx - Layout wrapper for shop owner pages with navbar and footer

owner-layout.css - Styling for the shop owner layout with subtle background pattern



Authentication Pages

Login.jsx - User login page with email/password form
Register.jsx - User registration page with role selection (buyer/shop owner)

Buyer Pages

Home.jsx - Buyer's home page with category navigation and product listings

home.css - Styling for the home page with hero section and product grid


ProductDetails.jsx - Detailed product view with add to cart functionality

product-details.css - Styling for the product details page with image gallery and tabs


Cart.jsx - Shopping cart page showing selected items and totals

cart.css - Styling for the cart page with responsive item display


Checkout.jsx - Order placement page with address and payment selection

checkout.css - Styling for multi-step checkout process


OrderTracking.jsx - Real-time order status tracking page

order-tracking.css - Styling for order tracking with progress visualization


OrderHistory.jsx - List of past orders with filtering options

order-history.css - Styling for order history display


Profile.jsx - User profile management for buyers

profile.css - Styling for profile tabs and forms



Owner Pages

Dashboard.jsx - Shop owner dashboard with key metrics and quick access

dashboard.css - Styling for dashboard with stat cards and charts


Products.jsx - Product management page with listing and actions

products.css - Styling for product management table


AddProduct.jsx - Form for adding or editing products

add-product.css - Styling for product form with image upload


NearbyOrders.jsx - Shows nearby orders that shop owners can accept

nearby-orders.css - Styling for location-based order cards


MyOrders.jsx - Orders accepted by the shop owner with status management

my-orders.css - Styling for owner's order table


Analytics.jsx - Sales and performance analytics with charts

analytics.css - Styling for analytics dashboard with charts and visualizations


OwnerProfile.jsx - Shop profile management for owners

owner-profile.css - Styling for shop profile editing interface



Common Components

Button.jsx - Reusable button component with variants

button.css - Styling for button variations and states


Input.jsx - Reusable input component with validation

input.css - Styling for form inputs with states


Navbar.jsx - Navigation component with user-specific links

navbar.css - Styling for responsive navigation


Footer.jsx - Page footer with links and information

footer.css - Styling for footer layout


Loader.jsx - Loading indicator component

loader.css - Styling for loading animations



Buyer Components

ProductCard.jsx - Card displaying product information in grid

product-card.css - Styling for product cards with hover effects


CategoryList.jsx - Horizontal scrolling category selector

category-list.css - Styling for category icons and scrolling


CartItem.jsx - Individual item in the shopping cart

cart-item.css - Styling for cart items with quantity controls


OrderTracker.jsx - Visual progress indicator for order status

order-tracker.css - Styling for step-based progress visualization


ShopOwnerDetails.jsx - Displays shop owner information to buyers

shop-owner-details.css - Styling for shop owner cards



Services

api.js - Base API configuration with request/response handling
auth.service.js - Authentication-related API calls (login, register, etc.)
product.service.js - Product-related API calls (fetch, create, update, delete)
order.service.js - Order-related API calls (create, update status, fetch)

Styles

variables.css - CSS variables for theming (colors, spacing, typography)
global.css - Global styles and utility classes

Utils

useLocation.js - Custom hook for geolocation functionality

📱 Features

User authentication with role-based access
Product browsing and searching
Shopping cart management
Order placement and tracking
Shop owner dashboard with analytics
Product management for shop owners
Real-time order tracking
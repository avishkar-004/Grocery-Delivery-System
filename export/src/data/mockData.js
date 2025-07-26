// Mock database structure as specified
export const productsTable = [
  { prod_name: "Turmeric Powder", category: "Spices & Masalas", desc: "Pure and organic turmeric powder for cooking" },
  { prod_name: "Basmati Rice", category: "Grains & Flours", desc: "Premium long grain basmati rice" },
  { prod_name: "Red Lentils", category: "Pulses & Lentils", desc: "Fresh red lentils, protein-rich" },
  { prod_name: "Coconut Oil", category: "Oils & Ghee", desc: "Cold-pressed virgin coconut oil" },
  { prod_name: "Mango Pickle", category: "Pickles & Condiments", desc: "Traditional spicy mango pickle" },
  { prod_name: "Masala Chips", category: "Snacks & Sweets", desc: "Crispy potato chips with Indian spices" },
  { prod_name: "Green Tea", category: "Beverages", desc: "Organic green tea leaves" },
  { prod_name: "Instant Noodles", category: "Ready-to-Cook / Instant Foods", desc: "Quick cooking masala noodles" },
  { prod_name: "Almonds", category: "Dry Fruits & Nuts", desc: "Premium quality roasted almonds" },
  { prod_name: "Incense Sticks", category: "Pooja & Daily Essentials", desc: "Aromatic incense sticks for prayers" },
  { prod_name: "Storage Containers", category: "Miscellaneous / Others", desc: "Food-grade plastic storage containers" }
];

export const quantityTable = {
  "Turmeric Powder": ["100g", "250g", "500g", "1kg"],
  "Basmati Rice": ["1kg", "5kg", "10kg", "25kg"],
  "Red Lentils": ["500g", "1kg", "2kg", "5kg"],
  "Coconut Oil": ["200ml", "500ml", "1L", "2L"],
  "Mango Pickle": ["200g", "500g", "1kg"],
  "Masala Chips": ["50g", "100g", "200g", "500g"],
  "Green Tea": ["100g", "250g", "500g"],
  "Instant Noodles": ["Pack of 1", "Pack of 5", "Pack of 12"],
  "Almonds": ["250g", "500g", "1kg", "2kg"],
  "Incense Sticks": ["Pack of 10", "Pack of 25", "Pack of 50"],
  "Storage Containers": ["500ml", "1L", "2L", "Set of 3"]
};

export const categories = [
  "Spices & Masalas",
  "Grains & Flours", 
  "Pulses & Lentils",
  "Oils & Ghee",
  "Pickles & Condiments",
  "Snacks & Sweets",
  "Beverages",
  "Ready-to-Cook / Instant Foods",
  "Dry Fruits & Nuts",
  "Pooja & Daily Essentials",
  "Miscellaneous / Others"
];

// Mock users data
export const mockUsers = {
  buyers: [
    { id: 1, name: "John Doe", email: "john@example.com", status: "active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", status: "active" }
  ],
  sellers: [
    { id: 1, name: "Fresh Mart", email: "freshmart@example.com", status: "active", location: "Downtown" },
    { id: 2, name: "Organic Store", email: "organic@example.com", status: "active", location: "Uptown" }
  ]
};

// Mock orders data
export const mockOrders = [
  {
    id: "ORD001",
    buyerName: "John Doe",
    items: [
      { name: "Turmeric Powder", quantity: "500g", price: 120 },
      { name: "Basmati Rice", quantity: "5kg", price: 450 }
    ],
    totalAmount: 570,
    status: "In Progress",
    date: "2024-01-15",
    address: "123 Main St, City"
  },
  {
    id: "ORD002", 
    buyerName: "Jane Smith",
    items: [
      { name: "Coconut Oil", quantity: "1L", price: 280 },
      { name: "Almonds", quantity: "500g", price: 350 }
    ],
    totalAmount: 630,
    status: "Completed",
    date: "2024-01-14",
    address: "456 Oak Ave, City"
  }
];
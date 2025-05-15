const db = require('./models');
const { hashPassword } = require('./utils/password.utils');

const Category = db.categories;
const User = db.users;
const ShopProfile = db.shopProfiles;
const Product = db.products;

module.exports = async () => {
  try {
    console.log('Seeding initial data...');
    
    // Seed categories if they don't exist
    const categoriesCount = await Category.count();
    
    if (categoriesCount === 0) {
      console.log('Seeding categories...');
      
      const categories = [
        { name: 'Fruits' },
        { name: 'Vegetables' },
        { name: 'Dairy' },
        { name: 'Bakery' },
        { name: 'Meat' },
        { name: 'Seafood' },
        { name: 'Beverages' },
        { name: 'Snacks' },
        { name: 'Canned Goods' },
        { name: 'Frozen Foods' }
      ];
      
      await Category.bulkCreate(categories);
      console.log(`${categories.length} categories created.`);
    }
    
    // Create demo shop owner if it doesn't exist
    const ownerEmail = 'shopowner@example.com';
    
    let owner = await User.findOne({
      where: { email: ownerEmail }
    });
    
    if (!owner) {
      console.log('Creating demo shop owner...');
      
      const hashedPassword = await hashPassword('password123');
      
      owner = await User.create({
        name: 'Demo Shop Owner',
        email: ownerEmail,
        password: hashedPassword,
        phone: '1234567890',
        role: 'owner'
      });
      
      // Create shop profile for the demo owner
      await ShopProfile.create({
        userId: owner.id,
        shopName: 'Fresh Grocery Mart',
        shopDescription: 'Your neighborhood grocery store for fresh and quality products',
        shopAddress: '123 Main Street',
        shopCity: 'Cityville',
        shopState: 'Stateville',
        shopZipCode: '12345',
        deliveryRadius: 10,
        minimumOrder: 10.00,
        openingTime: '08:00:00',
        closingTime: '20:00:00',
        latitude: 40.7128,
        longitude: -74.0060
      });
      
      console.log('Demo shop owner created.');
    }
    
    // Create demo buyer if it doesn't exist
    const buyerEmail = 'buyer@example.com';
    
    let buyer = await User.findOne({
      where: { email: buyerEmail }
    });
    
    if (!buyer) {
      console.log('Creating demo buyer...');
      
      const hashedPassword = await hashPassword('password123');
      
      buyer = await User.create({
        name: 'Demo Buyer',
        email: buyerEmail,
        password: hashedPassword,
        phone: '9876543210',
        role: 'buyer'
      });
      
      // Create address for demo buyer
      await db.addresses.create({
        userId: buyer.id,
        label: 'Home',
        addressLine1: '456 Oak Avenue',
        city: 'Cityville',
        state: 'Stateville',
        zipCode: '12345',
        isDefault: true,
        latitude: 40.7130,
        longitude: -74.0065
      });
      
      console.log('Demo buyer created.');
    }
    
    // Seed sample products if they don't exist
    const productsCount = await Product.count();
    
    if (productsCount === 0) {
      console.log('Seeding sample products...');
      
      // Get shop and categories
      const shop = await ShopProfile.findOne({
        where: { userId: owner.id }
      });
      
      const categories = await Category.findAll();
      
      if (shop && categories.length > 0) {
        const categoryMap = {};
        categories.forEach(category => {
          categoryMap[category.name] = category.id;
        });
        
        const products = [
          {
            name: 'Organic Apples',
            description: 'Fresh organic apples from local farms',
            price: 3.99,
            originalPrice: 4.99,
            categoryId: categoryMap['Fruits'],
            shopId: shop.id,
            stock: 100,
            inStock: true,
            weight: '1kg',
            origin: 'Local Farms',
            shelfLife: '2 weeks',
            storage: 'Refrigerated'
          },
          {
            name: 'Fresh Carrots',
            description: 'Crisp and crunchy fresh carrots',
            price: 1.99,
            categoryId: categoryMap['Vegetables'],
            shopId: shop.id,
            stock: 150,
            inStock: true,
            weight: '500g',
            origin: 'Local Farms',
            shelfLife: '1 week',
            storage: 'Refrigerated'
          },
          {
            name: 'Whole Milk',
            description: 'Fresh whole milk from grass-fed cows',
            price: 2.49,
            categoryId: categoryMap['Dairy'],
            shopId: shop.id,
            stock: 50,
            inStock: true,
            weight: '1L',
            origin: 'Local Dairy',
            shelfLife: '5 days',
            storage: 'Refrigerated'
          },
          {
            name: 'Artisan Bread',
            description: 'Freshly baked artisan sourdough bread',
            price: 4.99,
            categoryId: categoryMap['Bakery'],
            shopId: shop.id,
            stock: 20,
            inStock: true,
            weight: '750g',
            origin: 'In-house Bakery',
            shelfLife: '3 days',
            storage: 'Room temperature'
          },
          {
            name: 'Ground Beef',
            description: 'Premium ground beef, 85% lean',
            price: 6.99,
            originalPrice: 7.99,
            categoryId: categoryMap['Meat'],
            shopId: shop.id,
            stock: 30,
            inStock: true,
            weight: '500g',
            origin: 'Local Farm',
            shelfLife: '2 days',
            storage: 'Refrigerated/Frozen'
          },
          {
            name: 'Fresh Salmon Fillet',
            description: 'Wild-caught Atlantic salmon fillet',
            price: 12.99,
            categoryId: categoryMap['Seafood'],
            shopId: shop.id,
            stock: 15,
            inStock: true,
            weight: '300g',
            origin: 'Atlantic Ocean',
            shelfLife: '1-2 days',
            storage: 'Refrigerated/Frozen'
          },
          {
            name: 'Organic Orange Juice',
            description: 'Freshly squeezed organic orange juice, no added sugar',
            price: 3.99,
            categoryId: categoryMap['Beverages'],
            shopId: shop.id,
            stock: 40,
            inStock: true,
            weight: '1L',
            origin: 'California',
            shelfLife: '1 week',
            storage: 'Refrigerated'
          },
          {
            name: 'Potato Chips',
            description: 'Crunchy potato chips with sea salt',
            price: 2.99,
            categoryId: categoryMap['Snacks'],
            shopId: shop.id,
            stock: 60,
            inStock: true,
            weight: '200g',
            origin: 'Local Producer',
            shelfLife: '2 months',
            storage: 'Room temperature'
          },
          {
            name: 'Tomato Soup',
            description: 'Classic tomato soup, perfect for quick meals',
            price: 1.99,
            categoryId: categoryMap['Canned Goods'],
            shopId: shop.id,
            stock: 80,
            inStock: true,
            weight: '400g',
            origin: 'National Brand',
            shelfLife: '1 year',
            storage: 'Room temperature'
          },
          {
            name: 'Frozen Mixed Vegetables',
            description: 'Mix of frozen peas, carrots, corn, and green beans',
            price: 2.49,
            categoryId: categoryMap['Frozen Foods'],
            shopId: shop.id,
            stock: 45,
            inStock: true,
            weight: '500g',
            origin: 'Various',
            shelfLife: '6 months',
            storage: 'Frozen'
          }
        ];
        
        await Product.bulkCreate(products);
        console.log(`${products.length} sample products created.`);
      }
    }
    
    console.log('Initial data seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
};
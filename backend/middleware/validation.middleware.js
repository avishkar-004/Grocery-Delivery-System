const { validationResult, checkSchema } = require('express-validator');

// Generic validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// User validation schema
const userValidationRules = checkSchema({
  name: {
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'Name should be between 2 and 100 characters'
    },
    notEmpty: {
      errorMessage: 'Name is required'
    }
  },
  email: {
    isEmail: {
      errorMessage: 'Please enter a valid email address'
    },
    normalizeEmail: true,
    notEmpty: {
      errorMessage: 'Email is required'
    }
  },
  password: {
    isLength: {
      options: { min: 6 },
      errorMessage: 'Password must be at least 6 characters long'
    },
    notEmpty: {
      errorMessage: 'Password is required'
    }
  },
  phone: {
    optional: true,
    isMobilePhone: {
      errorMessage: 'Please enter a valid phone number'
    }
  },
  role: {
    isIn: {
      options: [['buyer', 'owner']],
      errorMessage: 'Role must be either buyer or owner'
    }
  }
});

// Product validation schema
const productValidationRules = checkSchema({
  name: {
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'Name should be between 2 and 100 characters'
    },
    notEmpty: {
      errorMessage: 'Name is required'
    }
  },
  description: {
    optional: true,
    isString: true,
    trim: true
  },
  price: {
    isFloat: {
      options: { min: 0.01 },
      errorMessage: 'Price must be a positive number'
    },
    notEmpty: {
      errorMessage: 'Price is required'
    }
  },
  originalPrice: {
    optional: true,
    isFloat: {
      options: { min: 0.01 },
      errorMessage: 'Original price must be a positive number'
    }
  },
  categoryId: {
    isUUID: {
      errorMessage: 'Invalid category ID format'
    },
    notEmpty: {
      errorMessage: 'Category ID is required'
    }
  },
  stock: {
    optional: true,
    isInt: {
      options: { min: 0 },
      errorMessage: 'Stock must be a non-negative integer'
    }
  },
  inStock: {
    optional: true,
    isBoolean: {
      errorMessage: 'In stock must be a boolean value'
    }
  }
});

// Order validation schema
const orderValidationRules = checkSchema({
  addressId: {
    isUUID: {
      errorMessage: 'Invalid address ID format'
    },
    notEmpty: {
      errorMessage: 'Address ID is required'
    }
  },
  paymentMethod: {
    isIn: {
      options: [['Card', 'Cash', 'Wallet']],
      errorMessage: 'Payment method must be Card, Cash, or Wallet'
    },
    notEmpty: {
      errorMessage: 'Payment method is required'
    }
  },
  items: {
    isArray: {
      errorMessage: 'Items must be an array'
    },
    notEmpty: {
      errorMessage: 'Order must contain at least one item'
    }
  },
  'items.*.productId': {
    isUUID: {
      errorMessage: 'Invalid product ID format'
    },
    notEmpty: {
      errorMessage: 'Product ID is required'
    }
  },
  'items.*.quantity': {
    isInt: {
      options: { min: 1 },
      errorMessage: 'Quantity must be a positive integer'
    }
  },
  deliveryInstructions: {
    optional: true,
    isString: true,
    trim: true
  }
});

// Address validation schema
const addressValidationRules = checkSchema({
  label: {
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: 'Label should be between 2 and 50 characters'
    },
    notEmpty: {
      errorMessage: 'Label is required'
    }
  },
  addressLine1: {
    isString: true,
    trim: true,
    isLength: {
      options: { min: 5, max: 255 },
      errorMessage: 'Address line 1 should be between 5 and 255 characters'
    },
    notEmpty: {
      errorMessage: 'Address line 1 is required'
    }
  },
  addressLine2: {
    optional: true,
    isString: true,
    trim: true
  },
  city: {
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'City should be between 2 and 100 characters'
    },
    notEmpty: {
      errorMessage: 'City is required'
    }
  },
  state: {
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'State should be between 2 and 100 characters'
    },
    notEmpty: {
      errorMessage: 'State is required'
    }
  },
  zipCode: {
    isString: true,
    trim: true,
    isLength: {
      options: { min: 5, max: 20 },
      errorMessage: 'Zip code should be between 5 and 20 characters'
    },
    notEmpty: {
      errorMessage: 'Zip code is required'
    }
  },
  isDefault: {
    optional: true,
    isBoolean: {
      errorMessage: 'Is default must be a boolean value'
    }
  },
  latitude: {
    optional: true,
    isFloat: {
      options: { min: -90, max: 90 },
      errorMessage: 'Latitude must be between -90 and 90'
    }
  },
  longitude: {
    optional: true,
    isFloat: {
      options: { min: -180, max: 180 },
      errorMessage: 'Longitude must be between -180 and 180'
    }
  }
});

// Review validation schema
const reviewValidationRules = checkSchema({
  productId: {
    isUUID: {
      errorMessage: 'Invalid product ID format'
    },
    notEmpty: {
      errorMessage: 'Product ID is required'
    }
  },
  rating: {
    isInt: {
      options: { min: 1, max: 5 },
      errorMessage: 'Rating must be an integer between 1 and 5'
    },
    notEmpty: {
      errorMessage: 'Rating is required'
    }
  },
  comment: {
    optional: true,
    isString: true,
    trim: true
  }
});

// Shop profile validation schema
const shopProfileValidationRules = checkSchema({
  shopName: {
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'Shop name should be between 2 and 100 characters'
    },
    notEmpty: {
      errorMessage: 'Shop name is required'
    }
  },
  shopDescription: {
    optional: true,
    isString: true,
    trim: true
  },
  shopAddress: {
    isString: true,
    trim: true,
    isLength: {
      options: { min: 5, max: 255 },
      errorMessage: 'Shop address should be between 5 and 255 characters'
    },
    notEmpty: {
      errorMessage: 'Shop address is required'
    }
  },
  shopCity: {
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'Shop city should be between 2 and 100 characters'
    },
    notEmpty: {
      errorMessage: 'Shop city is required'
    }
  },
  shopState: {
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'Shop state should be between 2 and 100 characters'
    },
    notEmpty: {
      errorMessage: 'Shop state is required'
    }
  },
  shopZipCode: {
    isString: true,
    trim: true,
    isLength: {
      options: { min: 5, max: 20 },
      errorMessage: 'Shop zip code should be between 5 and 20 characters'
    },
    notEmpty: {
      errorMessage: 'Shop zip code is required'
    }
  },
  deliveryRadius: {
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: 'Delivery radius must be between 1 and 100 kilometers'
    }
  },
  minimumOrder: {
    optional: true,
    isFloat: {
      options: { min: 0 },
      errorMessage: 'Minimum order must be a non-negative number'
    }
  },
  openingTime: {
    optional: true,
    isTime: {
      errorMessage: 'Opening time must be in HH:MM:SS format'
    }
  },
  closingTime: {
    optional: true,
    isTime: {
      errorMessage: 'Closing time must be in HH:MM:SS format'
    }
  }
});

module.exports = {
  validate,
  userValidationRules,
  productValidationRules,
  orderValidationRules,
  addressValidationRules,
  reviewValidationRules,
  shopProfileValidationRules
};
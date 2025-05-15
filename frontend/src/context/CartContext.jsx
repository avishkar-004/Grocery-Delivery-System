import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    // Calculate totals
    const { total, count } = cartItems.reduce(
      (acc, item) => ({
        total: acc.total + item.price * item.quantity,
        count: acc.count + item.quantity,
      }),
      { total: 0, count: 0 }
    );
    
    setTotalAmount(total);
    setTotalItems(count);
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      // Check if the product is already in the cart
      const existingItemIndex = prevItems.findIndex(
        (item) => item.id === product.id
      );

      if (existingItemIndex !== -1) {
        // Product exists in cart, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
        return updatedItems;
      } else {
        // Product is not in cart, add it
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => 
      prevItems.filter((item) => item.id !== productId)
    );
  };

  const updateCartItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const value = {
    cartItems,
    totalAmount,
    totalItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
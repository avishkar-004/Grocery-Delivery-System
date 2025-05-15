import { createContext, useState } from 'react';
import { 
  createNewOrder, 
  getOrders, 
  getOrderById, 
  updateOrderStatus 
} from '../services/order.service';

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create a new order
  const createOrder = async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const newOrder = await createNewOrder(orderData);
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      return newOrder;
    } catch (err) {
      setError(err.message || 'Failed to create order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch all orders for the current user
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedOrders = await getOrders();
      setOrders(fetchedOrders);
      return fetchedOrders;
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific order by ID
  const fetchOrderById = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const order = await getOrderById(orderId);
      return order;
    } catch (err) {
      setError(err.message || 'Failed to fetch order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update order status (for shop owners)
  const updateOrder = async (orderId, status) => {
    setLoading(true);
    setError(null);
    try {
      const updatedOrder = await updateOrderStatus(orderId, status);
      
      // Update the orders state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? updatedOrder : order
        )
      );
      
      return updatedOrder;
    } catch (err) {
      setError(err.message || 'Failed to update order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    orders,
    loading,
    error,
    createOrder,
    fetchOrders,
    fetchOrderById,
    updateOrder,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
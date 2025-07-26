import AdminLayout from "./AdminLayout";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  Home,
  LogOut,
  Sun,
  Moon,
  Users, // For Users link
  Package, // For Products link
  UserCircle, // For Profile icon (Dashboard link)
  PlusCircle, // Add Product/Category
  Edit, // Edit Product/Category
  Trash2, // Remove Product/Category
  CheckCircle, // Toast success
  AlertCircle, // Toast error/warning
  Tag, // Category icon
  Image, // Image/Icon placeholder
  List, // Quantity list
  X, // Close button for modals
  Check, // Active status check
  Search, // Add Search icon for search input
  ArrowDownWideNarrow, // Icon for sort descending
  ArrowUpWideNarrow, // Icon for sort ascending
  Filter, // Icon for filter
  BarChart2, // Icon for stats
  ToggleRight, // For active status toggle
  ToggleLeft, // For inactive status status toggle
} from "lucide-react";

// NOTE: Defined a base URL for easier management of API endpoints.
const API_BASE_URL = "http://localhost:3000/api";

const ProductManagement = ({ isDarkMode, showToast, handleLogout }) => {
  const navigate = useNavigate();

  // State for dark mode (removed redundant state, relying on prop)
  const [loading, setLoading] = useState(false);
  // Reintroduced activeTab state for tabbed interface
  const [activeTab, setActiveTab] = useState("products"); // 'products', 'categories'

  // Product states
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null for add, object for edit
  const [productFormData, setProductFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    image: "",
    // quantities is initialized with an empty string for quantity
    quantities: [{ quantity: "", unit_type: "" }], // Array of { quantity, unit_type }
    is_active: true,
  });

  // Pagination states for products
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10); // Matches backend default
  const [totalProductsCount, setTotalProductsCount] = useState(0); // From API response

  // State for product search and category filter in product section
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedCategoryFilterId, setSelectedCategoryFilterId] = useState(null); // null for all categories
  // State for product status filter
  const [productFilterStatus, setProductFilterStatus] = useState('all'); // 'all', 'active', 'inactive'


  // Category states
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null for add, object for edit
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    icon: "",
    is_active: true,
  });
  // State for category search query (used in category tab)
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  // State for debounced category search query
  const [debouncedCategorySearchQuery, setDebouncedCategorySearchQuery] = useState("");
  // State to indicate if category search is active (to show appropriate data)
  const [isCategorySearching, setIsCategorySearching] = useState(false);

  // State for category sorting and filtering (used in category tab)
  const [categorySortOrder, setCategorySortOrder] = useState('none'); // 'none', 'productCountAsc', 'productCountDesc'
  const [categoryFilterStatus, setCategoryFilterStatus] = useState('all'); // 'all', 'active', 'inactive'

  // State for product statistics
  const [productStats, setProductStats] = useState(null);

  // Custom confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmModalAction, setConfirmModalAction] = useState(null); // Function to execute on confirm

  // Define valid unit types
  const UNIT_TYPES = ['weight', 'volume', 'piece'];

  // Debounce effect for category search query (for category tab)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCategorySearchQuery(categorySearchQuery);
    }, 500); // 500ms debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [categorySearchQuery]); // Only re-run if categorySearchQuery changes

  // --- API Calls ---

  const getAuthHeaders = () => {
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      showToast("Authentication required. Please log in.", "error");
      navigate("/admin/login");
      return null;
    }
    return {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    };
  };

  // Modified fetchProducts to include pagination, search, category_id, and is_active parameters
  const fetchProducts = useCallback(async (page = 1, limit = 10, search = "", categoryId = null, isActive = 'all') => {
    setLoading(true);
    const headers = getAuthHeaders();
    if (!headers) {
      setLoading(false);
      return;
    }

    try {
      let apiUrl = `${API_BASE_URL}/admin/products?page=${page}&limit=${limit}`;
      if (search) {
        apiUrl += `&search=${encodeURIComponent(search)}`;
      }
      if (categoryId) {
        apiUrl += `&category_id=${categoryId}`;
      }
      // UPDATED: Send '1' or '0' for is_active to match backend
      if (isActive !== 'all') {
        apiUrl += `&is_active=${isActive === 'active' ? '1' : '0'}`;
      }

      console.log(`[fetchProducts] Fetching from: ${apiUrl}`);
      const response = await fetch(apiUrl, { headers });
      const data = await response.json();
      console.log("[fetchProducts] API Response:", data);

      if (data.success) {
        setProducts(data.data.products || []);
        setTotalProductsCount(data.data.pagination.total || 0); // Use 'total' from backend response
        setCurrentPage(data.data.pagination.page || 1); // Use 'page' from backend response
      } else {
        showToast(data.message || "Failed to fetch products.", "error");
        console.error("[fetchProducts] API Error:", data.message);
      }
    } catch (error) {
      console.error("[fetchProducts] Network error fetching products:", error);
      showToast("Network error. Could not load products.", "error");
    } finally {
      setLoading(false);
    }
  }, [navigate, showToast]); // Added showToast to dependencies

  const fetchCategories = useCallback(async (searchQuery = "") => {
    setLoading(true);
    const headers = getAuthHeaders();
    if (!headers) {
      setLoading(false);
      return;
    }

    try {
      let categoriesApiUrl;
      if (searchQuery) {
        categoriesApiUrl = `${API_BASE_URL}/admin/cate/search?q=${encodeURIComponent(searchQuery)}`;
        setIsCategorySearching(true);
      } else {
        categoriesApiUrl = `${API_BASE_URL}/admin/categories/display`;
        setIsCategorySearching(false);
      }

      // Fetch categories. We don't fetch products here anymore to avoid double fetching
      // when on the products tab, and to allow independent category fetching for the category tab.
      const categoriesResponse = await fetch(categoriesApiUrl, { headers });
      const categoriesData = await categoriesResponse.json();

      if (categoriesData.success) {
        const fetchedCategories = categoriesData.data.categories || [];
        // For categories, we might need product counts, so we'll fetch products separately if needed
        // or rely on the product_count field if the backend provides it directly for categories/display.
        // For now, we'll assume product_count is available or calculated.
        setCategories(fetchedCategories);
      } else {
        showToast("Failed to fetch categories.", "error");
        console.error("[fetchCategories] API Error - Categories:", categoriesData.message);
      }
    } catch (error) {
      console.error("[fetchCategories] Network error fetching categories:", error);
      showToast("Network error. Could not load categories.", "error");
    } finally {
      setLoading(false);
    }
  }, [navigate, showToast]); // Added showToast to dependencies


  // Fetch product statistics
  const fetchProductStats = useCallback(async () => {
    setLoading(true);
    const headers = getAuthHeaders();
    if (!headers) {
      setLoading(false);
      return;
    }

    try {
      const apiUrl = `${API_BASE_URL}/admin/products/stats`;
      console.log(`[fetchProductStats] Fetching from: ${apiUrl}`);
      const response = await fetch(apiUrl, { headers });
      const data = await response.json();
      console.log("[fetchProductStats] API Response:", data);

      if (data.success) {
        setProductStats(data.data);
      } else {
        showToast(data.message || "Failed to fetch product statistics.", "error");
        console.error("[fetchProductStats] API Error:", data.message);
      }
    } catch (error) {
      console.error("[fetchProductStats] Network error fetching product statistics:", error);
      showToast("Network error. Could not load product statistics.", "error");
    } finally {
      setLoading(false);
    }
  }, [navigate, showToast]); // Added showToast to dependencies

  // Handle category search input change (for category tab)
  const handleCategorySearchChange = (e) => {
    setCategorySearchQuery(e.target.value);
  };

  // Handle category search submission (for explicit search button/enter on category tab)
  const handleCategorySearch = (e) => {
    e.preventDefault(); // Prevent full page reload
    fetchCategories(categorySearchQuery); // Trigger immediate search
  };

  // Clear category search (for category tab)
  const handleClearCategorySearch = () => {
    setCategorySearchQuery(""); // Clear input field
    setDebouncedCategorySearchQuery(""); // Also clear debounced state, which will trigger a fetch of all categories
  };

  // Handle product search input change
  const handleProductSearchChange = (e) => {
    setProductSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle product search submission
  const handleProductSearchSubmit = (e) => {
    e.preventDefault(); // Prevent form default submission
    fetchProducts(1, productsPerPage, productSearchQuery, selectedCategoryFilterId, productFilterStatus);
  };

  // Handle category filter click for products
  const handleCategoryFilterClick = (categoryId) => {
    setSelectedCategoryFilterId(categoryId);
    setProductSearchQuery(""); // Clear product search when filtering by category
    setCurrentPage(1); // Reset to first page on new filter
  };

  // Handle clear product category filter
  const handleClearProductCategoryFilter = () => {
    setSelectedCategoryFilterId(null);
    setCurrentPage(1); // Reset to first page
  };

  // Handle product status filter change
  const handleProductFilterStatusChange = (e) => {
    setProductFilterStatus(e.target.value);
    setCurrentPage(1); // Reset to first page on new filter
  };


  // Main useEffect to fetch data based on active tab and debounced search query
  useEffect(() => {
    if (activeTab === "products") {
      // Pass all relevant filters including productFilterStatus
      fetchProducts(currentPage, productsPerPage, productSearchQuery, selectedCategoryFilterId, productFilterStatus);
      fetchProductStats(); // Fetch stats when on products tab
      fetchCategories(); // Always fetch all categories to populate filter buttons
    } else if (activeTab === "categories") {
      // Fetch categories based on the debounced search query
      fetchCategories(debouncedCategorySearchQuery);
    }
  }, [activeTab, fetchProducts, fetchCategories, debouncedCategorySearchQuery, fetchProductStats, currentPage, productsPerPage, productSearchQuery, selectedCategoryFilterId, productFilterStatus]);


  // --- Product Management ---

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: "",
      description: "",
      category_id: categories.length > 0 ? categories[0].id : "",
      image: "",
      quantities: [{ quantity: "", unit_type: "" }], // Initial quantity field with empty string
      is_active: true,
    });
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    // Debugging line: Check the product object received from the backend
    console.log("Product data received for editing:", product);
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      image: product.image,
      // Ensure quantities array is not null and contains valid objects
      // Convert quantity to string for input fields as they expect strings
      quantities: product.quantities && product.quantities.length > 0
          ? product.quantities.map(q => ({ ...q, quantity: q.quantity.toString() }))
          : [{ quantity: "", unit_type: "" }],
      is_active: product.is_active,
    });
    setShowProductModal(true);
  };

  const handleProductFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleQuantityChange = (index, field, value) => {
    const newQuantities = [...productFormData.quantities];
    newQuantities[index] = { ...newQuantities[index], [field]: value };
    setProductFormData((prev) => ({ ...prev, quantities: newQuantities }));
  };

  const addQuantityField = () => {
    setProductFormData((prev) => ({
      ...prev,
      quantities: [...prev.quantities, { quantity: "", unit_type: "" }],
    }));
  };

  const removeQuantityField = (index) => {
    const newQuantities = productFormData.quantities.filter((_, i) => i !== index);
    setProductFormData((prev) => ({ ...prev, quantities: newQuantities }));
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();

    // Step 1: Prepare quantities from form data.
    // Convert string quantity from input to float, or null if empty.
    // Keep only rows where either quantity (after parsing) or unit_type is provided.
    const currentQuantities = productFormData.quantities
        .map(q => ({
          id: q.id,
          quantity: q.quantity.trim() !== '' ? q.quantity.trim() : null, // Keep as string, not number
          unit_type: q.unit_type.trim()
        }))
        .filter(q => q.quantity !== null || q.unit_type !== '');

    let payload = {
      name: productFormData.name,
      description: productFormData.description,
      category_id: parseInt(productFormData.category_id),
      image: productFormData.image,
      is_active: productFormData.is_active,
    };

    const action = async () => {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }

      try {
        let response;
        if (editingProduct) {
          // Logic for updating quantities based on changes
          const originalQuantities = editingProduct.quantities || [];
          const quantitiesToUpdate = [];
          const quantitiesToAdd = [];
          const quantityIdsToDelete = [];

          // Identify updates and additions
          currentQuantities.forEach(newQty => {
            if (newQty.id) {
              // Existing quantity, check for changes
              const originalQty = originalQuantities.find(oldQty => oldQty.id === newQty.id);
              if (originalQty && (originalQty.quantity !== newQty.quantity || originalQty.unit_type !== newQty.unit_type)) {
                quantitiesToUpdate.push(newQty);
              }
            } else if (newQty.quantity !== null && newQty.unit_type.trim() !== '') {
              // This condition ensures that only new quantities with both a valid number
              // and a unit type are considered for addition.
              quantitiesToAdd.push(newQty);
            }
          });

          // Identify deletions
          originalQuantities.forEach(oldQty => {
            const found = currentQuantities.some(newQty => newQty.id === oldQty.id);
            if (!found) {
              quantityIdsToDelete.push(oldQty.id);
            }
          });

          // Add quantity specific payload parts only if there are changes
          if (quantitiesToUpdate.length > 0) payload.update_quantities = quantitiesToUpdate;
          if (quantitiesToAdd.length > 0) payload.add_quantities = quantitiesToAdd;
          if (quantityIdsToDelete.length > 0) payload.delete_quantity_ids = quantityIdsToDelete;


          const url = `${API_BASE_URL}/admin/products/${editingProduct.id}/edit`;
          console.log("[handleSubmitProduct] Editing product payload:", payload);
          response = await fetch(url, {
                method: "PUT",
                headers,
                body: JSON.stringify(payload),
              }
          );
        } else {
          // Step 2 (for NEW products): Apply stricter filter for final payload
          // Ensure both quantity (as a number) and unit_type are present for new entries
          payload.quantities = currentQuantities.filter(q => q.quantity !== null && q.unit_type.trim() !== '');

          const url = `${API_BASE_URL}/admin/products/add`;
          console.log("[handleSubmitProduct] Adding product payload:", payload);
          response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });
        }
        const data = await response.json();

        if (data.success) {
          showToast(editingProduct ? "Product updated successfully!" : "Product added successfully!", "success");
          setShowProductModal(false);
          // Refresh products list, maintaining current page and filters
          fetchProducts(currentPage, productsPerPage, productSearchQuery, selectedCategoryFilterId, productFilterStatus);
          fetchProductStats(); // Refresh stats after product change
        } else {
          showToast(data.message || "Failed to save product.", "error");
        }
      } catch (error) {
        console.error("[handleSubmitProduct] Network error saving product:", error);
        showToast("Network error. Could not save product.", "error");
      } finally {
        setLoading(false);
        setShowConfirmModal(false); // Close modal here after action completes
      }
    };

    // If editing product, show confirmation for complex updates (quantities, status changes implied)
    if (editingProduct) {
      setConfirmModalMessage("Are you sure you want to save changes to this product?");
      setConfirmModalAction(() => action); // Pass the action function
      setShowConfirmModal(true);
    } else {
      // For new product, no confirmation needed unless specific logic dictates
      action();
    }
  };

  const handleRemoveProduct = (productId) => {
    setConfirmModalMessage(`Are you sure you want to remove product ID ${productId}? This cannot be undone.`);
    setConfirmModalAction(() => async () => { // Wrap the async function
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }
      try {
        const url = `${API_BASE_URL}/admin/products/${productId}/remove`;
        console.log("[handleRemoveProduct] Removing product:", url);
        const response = await fetch(url, { method: "DELETE", headers });
        const data = await response.json();

        if (data.success) {
          showToast("Product removed successfully!", "success");
          // Refresh products list, maintaining current page and filters
          fetchProducts(currentPage, productsPerPage, productSearchQuery, selectedCategoryFilterId, productFilterStatus);
          fetchProductStats(); // Refresh stats after product change
        } else {
          showToast(data.message || "Failed to remove product.", "error");
        }
      } catch (error) {
        console.error("[handleRemoveProduct] Network error removing product:", error);
        showToast("Network error. Could not remove product.", "error");
      } finally {
        setLoading(false);
        setShowConfirmModal(false); // Close modal here after action completes
      }
    });
    setShowConfirmModal(true);
  };

  // Handle toggling product status
  const handleToggleProductStatus = (product) => {
    const newStatus = !product.is_active;
    const actionType = newStatus ? "activate" : "suspend";
    const message = `Are you sure you want to ${actionType} product "${product.name}"?`;

    setConfirmModalMessage(message);
    setConfirmModalAction(() => async () => { // Wrap the async function
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }

      try {
        const url = `${API_BASE_URL}/admin/products/${product.id}/status`;
        console.log(`[handleToggleProductStatus] Toggling status for product ${product.id} to ${newStatus}`);
        const response = await fetch(url, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ is_active: newStatus }),
        });
        const data = await response.json();

        if (data.success) {
          showToast(`Product ${actionType}d successfully!`, "success");
          // Refresh products list, maintaining current page and filters
          fetchProducts(currentPage, productsPerPage, productSearchQuery, selectedCategoryFilterId, productFilterStatus);
          fetchProductStats(); // Refresh stats after product change
        } else {
          showToast(data.message || `Failed to ${actionType} product.`, "error");
          console.error(`[handleToggleProductStatus] API Error:`, data.message);
        }
      } catch (error) {
        console.error(`[handleToggleProductStatus] Network error ${actionType}ing product:`, error);
        showToast(`Network error. Could not ${actionType} product.`, "error");
      } finally {
        setLoading(false);
        setShowConfirmModal(false); // Close modal here after action completes
      }
    });
    setShowConfirmModal(true);
  };


  // --- Category Management ---

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: "", description: "", icon: "", is_active: true });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      is_active: category.is_active,
    });
    setShowCategoryModal(true);
  };

  const handleCategoryFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoryFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();

    const action = async () => {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }

      try {
        let response;
        if (editingCategory) {
          const url = `${API_BASE_URL}/admin/categories/${editingCategory.id}/edit`;
          console.log("[handleSubmitCategory] Editing category:", url, categoryFormData);
          response = await fetch(url, {
                method: "PUT",
                headers,
                body: JSON.stringify(categoryFormData),
              }
          );
        } else {
          const url = `${API_BASE_URL}/admin/categories/add`;
          console.log("[handleSubmitCategory] Adding category:", url, categoryFormData);
          response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(categoryFormData),
          });
        }
        const data = await response.json();

        if (data.success) {
          showToast(editingCategory ? "Category updated successfully!" : "Category added successfully!", "success");
          setShowCategoryModal(false);
          fetchCategories(debouncedCategorySearchQuery); // Refresh with current search query or all
          fetchProductStats(); // Refresh stats as category changes might affect product counts
          // Also refresh products, as their categories might have changed
          fetchProducts(currentPage, productsPerPage, productSearchQuery, selectedCategoryFilterId, productFilterStatus);
        } else {
          showToast(data.message || "Failed to save category.", "error");
        }
      } catch (error) {
        console.error("[handleSubmitCategory] Network error saving category:", error);
        showToast("Network error. Could not save category.", "error");
      } finally {
        setLoading(false);
        setShowConfirmModal(false); // Close modal here
      }
    };

    if (editingCategory) {
      setConfirmModalMessage("Are you sure you want to save changes to this category?");
      setConfirmModalAction(() => action);
      setShowConfirmModal(true);
    } else {
      action();
    }
  };

  const handleRemoveCategory = (categoryId) => {
    setConfirmModalMessage(`Are you sure you want to remove category ID ${categoryId}? This may fail if it contains products.`);
    setConfirmModalAction(() => async () => { // Wrap the async function
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }
      try {
        const url = `${API_BASE_URL}/admin/categories/${categoryId}/remove`;
        console.log("[handleRemoveCategory] Removing category:", url);
        const response = await fetch(url, { method: "DELETE", headers });
        const data = await response.json();

        if (data.success) {
          showToast("Category removed successfully!", "success");
          fetchCategories(debouncedCategorySearchQuery); // Refresh with current search query or all
          // Also refresh products, as their categories might be gone
          fetchProducts(currentPage, productsPerPage, productSearchQuery, selectedCategoryFilterId, productFilterStatus);
          fetchProductStats(); // Refresh stats after category change
        } else {
          showToast(data.message || "Failed to remove category.", "error");
        }
      } catch (error) {
        console.error("[handleRemoveCategory] Network error removing category:", error);
        showToast("Network error. Could not remove category.", "error");
      } finally {
        setLoading(false);
        setShowConfirmModal(false); // Close modal here
      }
    });
    setShowConfirmModal(true);
  };

  // Function to handle toggling category status
  const handleToggleCategoryStatus = (category) => {
    const newStatus = !category.is_active;
    const actionType = newStatus ? "activate" : "suspend";
    const message = newStatus
        ? `Are you sure you want to activate category "${category.name}"?`
        : `Are you sure you want to suspend category "${category.name}"? If there are active products in this category, you will be prompted to suspend them first.`;

    setConfirmModalMessage(message);
    setConfirmModalAction(() => async () => { // Wrap the async function
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }

      try {
        const url = `${API_BASE_URL}/admin/categories/${category.id}/status`;
        console.log(`[handleToggleCategoryStatus] Toggling status for category ${category.id} to ${newStatus}`);
        const response = await fetch(url, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ is_active: newStatus }),
        });
        const data = await response.json();

        if (data.success) {
          showToast(`Category ${actionType}d successfully!`, "success");
          fetchCategories(debouncedCategorySearchQuery); // Refresh categories
          fetchProductStats(); // Refresh stats as category changes might affect product counts
          // Also refresh products, as their categories might be gone or updated
          fetchProducts(currentPage, productsPerPage, productSearchQuery, selectedCategoryFilterId, productFilterStatus);
        } else {
          showToast(data.message || `Failed to ${actionType} category.`, "error");
        }
      } catch (error) {
        console.error(`[handleToggleCategoryStatus] Network error ${actionType}ing category:`, error);
        showToast(`Network error. Could not ${actionType} category.`, "error");
      } finally {
        setLoading(false);
        setShowConfirmModal(false); // Close modal here
      }
    });
    setShowConfirmModal(true);
  };

  // Helper function to get product count color class
  const getProductCountColorClass = (count) => {
    if (count < 5) {
      return 'text-red-500 dark:text-red-400';
    } else if (count >= 5 && count < 10) {
      return 'text-yellow-500 dark:text-yellow-400';
    } else { // count >= 10
      return 'text-green-500 dark:text-green-400';
    }
  };

  // Memoized filtered and sorted categories (for category tab)
  const filteredAndSortedCategories = useMemo(() => {
    let filtered = [...categories];

    // Apply filter by status
    if (categoryFilterStatus === 'active') {
      filtered = filtered.filter(cat => cat.is_active);
    } else if (categoryFilterStatus === 'inactive') {
      filtered = filtered.filter(cat => !cat.is_active);
    }

    // Apply sort by product count
    if (categorySortOrder === 'productCountAsc') {
      filtered.sort((a, b) => (a.product_count || 0) - (b.product_count || 0));
    } else if (categorySortOrder === 'productCountDesc') {
      filtered.sort((a, b) => (b.product_count || 0) - (a.product_count || 0));
    }

    return filtered;
  }, [categories, categoryFilterStatus, categorySortOrder]);


  // --- Other Handlers ---


  // --- JSX Rendering ---
  // Custom Confirmation Modal Component
  const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl max-w-sm w-full text-center animate-scale-in-subtle">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{message}</p>
          <div className="flex justify-center space-x-4">
            <button onClick={onConfirm} className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 shadow-md" >
              Confirm
            </button>
            <button onClick={onCancel} className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200 shadow-md" >
              Cancel
            </button>
          </div>
        </div>
      </div>
  );

  return (

      <AdminLayout isDarkMode={isDarkMode} showToast={showToast} handleLogout={handleLogout}>

        {showConfirmModal && (
            <ConfirmationModal message={confirmModalMessage} onConfirm={confirmModalAction} onCancel={() => setShowConfirmModal(false)} />
        )}

        {/* Secondary Navigation for Products and Categories */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 text-lg font-medium transition-colors duration-200 ${
                  activeTab === "products"
                      ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              } active:scale-95`}
          >
            Products
          </button>
          <button
              onClick={() => setActiveTab("categories")}
              className={`px-4 py-2 text-lg font-medium transition-colors duration-200 ${
                  activeTab === "categories"
                      ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              } active:scale-95`}
          >
            Categories
          </button>
        </div>

        {activeTab === "products" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-4 sm:space-y-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product List</h2>
                <button onClick={handleAddProduct} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 shadow-md transition-all duration-200 hover:scale-105 active:scale-95">
                  <PlusCircle className="w-5 h-5" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Product Statistics Display */}
              {productStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg shadow-md flex items-center justify-between transition-all duration-200 hover:scale-105 active:scale-95">
                      <div className="flex items-center space-x-3">
                        <BarChart2 className="w-6 h-6 text-purple-700 dark:text-purple-300" />
                        <span className="text-lg font-semibold text-purple-800 dark:text-purple-200">Total Active Products:</span>
                      </div>
                      <span className="text-2xl font-bold text-purple-900 dark:text-white">{productStats.productStatus.active}</span>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg shadow-md flex items-center justify-between transition-all duration-200 hover:scale-105 active:scale-95">
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="w-6 h-6 text-yellow-700 dark:text-yellow-300" />
                        <span className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">Total Inactive Products:</span>
                      </div>
                      <span className="text-2xl font-bold text-yellow-900 dark:text-white">{productStats.productStatus.inactive}</span>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg shadow-md flex items-center justify-between transition-all duration-200 hover:scale-105 active:scale-95">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-green-700 dark:text-green-300" />
                        <span className="text-lg font-semibold text-green-800 dark:text-green-200">New Products (Last 7 Days):</span>
                      </div>
                      <span className="text-2xl font-bold text-green-900 dark:text-white">{productStats.newProductsLast7Days}</span>
                    </div>
                  </div>
              )}

              {/* Product Search and Filters */}
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner">
                {/* Product Search Bar */}
                <form onSubmit={handleProductSearchSubmit} className="flex items-center w-full sm:w-auto flex-grow">
                  <input
                      type="text"
                      placeholder="Search products by name or description..."
                      value={productSearchQuery}
                      onChange={handleProductSearchChange}
                      className="flex-grow px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                      type="submit"
                      className="ml-2 p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-200 transition-all duration-200 hover:scale-110 active:scale-95"
                      title="Search Products"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  {productSearchQuery && (
                      <button
                          type="button"
                          onClick={() => setProductSearchQuery("")} // Clear search query
                          className="ml-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Clear Search"
                      >
                        <X className="w-5 h-5" />
                      </button>
                  )}
                </form>

                {/* Product Status Filter */}
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <label htmlFor="productFilterStatus" className="text-gray-700 dark:text-gray-300 text-sm font-bold">Status:</label>
                  <select
                      id="productFilterStatus"
                      value={productFilterStatus}
                      onChange={handleProductFilterStatusChange}
                      className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              {/* Category Filter Buttons */}
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                <button onClick={handleClearProductCategoryFilter} className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                    selectedCategoryFilterId === null ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
                >
                  Show All
                </button>
                {categories.map(category => (
                    <button key={category.id} onClick={() => handleCategoryFilterClick(category.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                        selectedCategoryFilterId === category.id ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    }`}
                    >
                      {category.icon ? (
                          category.icon.startsWith('http') ? (
                              <img src={category.icon} alt={category.name} className="h-5 w-5 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/20x20/E0E0E0/333333?text=Icon"; }} />
                          ) : (
                              <span className="text-xl leading-none">{category.icon}</span>
                          )
                      ) : (
                          <Tag className="w-4 h-4" />
                      )}
                      <span>{category.name}</span>
                    </button>
                ))}
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 dark:from-indigo-700 dark:via-purple-800 dark:to-violet-900 shadow-md shadow-purple-300/40 dark:shadow-purple-800/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Image</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Quantities</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {products.length > 0 ? (
                      products.map((product) => (
                          <tr key={product.id} className="bg-gradient-to-r from-white to-purple-50 dark:from-gray-800 dark:to-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-colors duration-150 relative z-0 hover:shadow-lg hover:z-[1]">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-800 dark:text-purple-300">{product.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {product.image ? (
                                  <img src={product.image} alt={product.name} className="h-10 w-10 object-contain rounded-md" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/E0E0E0/333333?text=No+Img"; }} />
                              ) : (
                                  <div className="h-10 w-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400">
                                    <Image className="w-5 h-5" />
                                  </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{product.name}</td>
                            <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-700 dark:text-gray-300">{product.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {categories.find(cat => cat.id === product.category_id)?.name || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                              {product.quantities && product.quantities.length > 0 ? (
                                  <ul className="list-disc list-inside">
                                    {/* Only display quantity, removed unit_type */}
                                    {product.quantities.map((q, index) => (
                                        <li key={index}>{q.quantity} {q.unit_type}</li>
                                    ))}
                                  </ul>
                              ) : (
                                  <span>N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                  onClick={() => handleToggleProductStatus(product)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                      product.is_active ? 'bg-green-600' : 'bg-red-600'
                                  } focus:ring-green-500 dark:focus:ring-green-700`}
                                  title={product.is_active ? "Deactivate Product" : "Activate Product"}
                              >
                                  <span
                                      className={`${
                                          product.is_active ? 'translate-x-6' : 'translate-x-1'
                                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                  />
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                <button onClick={() => handleEditProduct(product)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200 hover:scale-110 active:scale-95" title="Edit Product">
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleRemoveProduct(product.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200 hover:scale-110 active:scale-95" title="Remove Product">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                      ))
                  ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                          {loading ? "Loading products..." : "No products found."}
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>

              {/* Product Pagination */}
              {totalProductsCount > 0 && (
                  <div className="flex justify-between items-center mt-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || loading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {Math.ceil(totalProductsCount / productsPerPage)}
                  </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalProductsCount / productsPerPage), prev + 1))}
                        disabled={currentPage === Math.ceil(totalProductsCount / productsPerPage) || loading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
              )}

              {/* Product Modal */}
              {showProductModal && (
                  <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl max-w-2xl w-full animate-scale-in-subtle overflow-y-auto max-h-[90vh]">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                        <button onClick={() => setShowProductModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200">
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <form onSubmit={handleSubmitProduct}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                            <input type="text" id="name" name="name" value={productFormData.name} onChange={handleProductFormChange} required className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 animate-input-slide" />
                          </div>
                          <div>
                            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select id="category_id" name="category_id" value={productFormData.category_id} onChange={handleProductFormChange} required className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 animate-input-slide">
                              {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="mb-4">
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                          <textarea id="description" name="description" value={productFormData.description} onChange={handleProductFormChange} rows="3" className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 animate-input-slide"></textarea>
                        </div>
                        <div className="mb-4">
                          <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                          <input type="text" id="image" name="image" value={productFormData.image} onChange={handleProductFormChange} className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 animate-input-slide" />
                        </div>

                        {/* Quantities Section */}
                        <div className="mb-4 p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Product Quantities</h4>
                            <button type="button" onClick={addQuantityField} className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200">
                              Add Quantity
                            </button>
                          </div>
                          {productFormData.quantities.map((q, index) => (
                              <div key={index} className="grid grid-cols-3 gap-3 mb-3 items-center">
                                {/* Input type is "text" to allow flexible input, parseFloat handles conversion */}
                                <input type="text" placeholder="Quantity" value={q.quantity} onChange={(e) => handleQuantityChange(index, "quantity", e.target.value)} className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500" />
                                <select
                                    value={q.unit_type}
                                    onChange={(e) => handleQuantityChange(index, "unit_type", e.target.value)}
                                    className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                                >
                                  <option value="">Select Unit Type</option> {/* A default, unselected option */}
                                  {UNIT_TYPES.map(unit => (
                                      <option key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</option>
                                  ))}
                                </select>
                                <button type="button" onClick={() => removeQuantityField(index)} className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 disabled:opacity-50" disabled={productFormData.quantities.length === 1}>
                                  Remove
                                </button>
                              </div>
                          ))}
                        </div>

                        <div className="mb-4 flex items-center">
                          <input type="checkbox" id="is_active_product" name="is_active" checked={productFormData.is_active} onChange={handleProductFormChange} className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600" />
                          <label htmlFor="is_active_product" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Is Active</label>
                        </div>
                        <div className="flex justify-end space-x-4">
                          <button type="button" onClick={() => setShowProductModal(false)} className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200 shadow-md transition-all duration-200 hover:scale-105 active:scale-95">Cancel</button>
                          <button type="submit" disabled={loading} className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95">{loading ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}</button>
                        </div>
                      </form>
                    </div>
                  </div>
              )}
            </div>
        )}

        {activeTab === "categories" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-4 sm:space-y-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Category List</h2>
                <button onClick={handleAddCategory} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 shadow-md transition-all duration-200 hover:scale-105 active:scale-95">
                  <PlusCircle className="w-5 h-5" />
                  <span>Add New Category</span>
                </button>
              </div>

              {/* Category Search, Sort, and Filter */}
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner">
                {/* Category Search Bar */}
                <form onSubmit={handleCategorySearch} className="flex items-center w-full sm:w-auto flex-grow">
                  <input
                      type="text"
                      placeholder="Search categories by name..."
                      value={categorySearchQuery}
                      onChange={handleCategorySearchChange}
                      className="flex-grow px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                      type="submit"
                      className="ml-2 p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-200 transition-all duration-200 hover:scale-110 active:scale-95"
                      title="Search Categories"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  {categorySearchQuery && (
                      <button
                          type="button"
                          onClick={handleClearCategorySearch}
                          className="ml-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Clear Search"
                      >
                        <X className="w-5 h-5" />
                      </button>
                  )}
                </form>

                {/* Category Status Filter */}
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <label htmlFor="categoryFilterStatus" className="text-gray-700 dark:text-gray-300 text-sm font-bold">Status:</label>
                  <select
                      id="categoryFilterStatus"
                      value={categoryFilterStatus}
                      onChange={(e) => setCategoryFilterStatus(e.target.value)}
                      className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Category Sort Order */}
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  {categorySortOrder === 'productCountAsc' && <ArrowUpWideNarrow className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
                  {categorySortOrder === 'productCountDesc' && <ArrowDownWideNarrow className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
                  {categorySortOrder === 'none' && <List className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
                  <label htmlFor="categorySortOrder" className="text-gray-700 dark:text-gray-300 text-sm font-bold">Sort By:</label>
                  <select
                      id="categorySortOrder"
                      value={categorySortOrder}
                      onChange={(e) => setCategorySortOrder(e.target.value)}
                      className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="none">None</option>
                    <option value="productCountAsc">Product Count (Low to High)</option>
                    <option value="productCountDesc">Product Count (High to Low)</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 dark:from-indigo-700 dark:via-purple-800 dark:to-violet-900 shadow-md shadow-purple-300/40 dark:shadow-purple-800/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Icon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Products Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAndSortedCategories.length > 0 ? (
                      filteredAndSortedCategories.map((category) => (
                          <tr key={category.id} className="bg-gradient-to-r from-white to-purple-50 dark:from-gray-800 dark:to-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-colors duration-150 relative z-0 hover:shadow-lg hover:z-[1]">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-800 dark:text-purple-300">{category.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {category.icon ? (
                                  category.icon.startsWith('http') ? (
                                      <img src={category.icon} alt={category.name} className="h-8 w-8 object-contain rounded-md" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/32x32/E0E0E0/333333?text=Icon"; }} />
                                  ) : (
                                      <span className="text-2xl leading-none">{category.icon}</span>
                                  )
                              ) : (
                                  <div className="h-8 w-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400">
                                    <Tag className="w-5 h-5" />
                                  </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{category.name}</td>
                            <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-700 dark:text-gray-300">{category.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={`font-bold ${getProductCountColorClass(category.product_count || 0)}`}>
                              {category.product_count || 0}
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                  onClick={() => handleToggleCategoryStatus(category)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                      category.is_active ? 'bg-green-600' : 'bg-red-600'
                                  } focus:ring-green-500 dark:focus:ring-green-700`}
                                  title={category.is_active ? "Deactivate Category" : "Activate Category"}
                              >
                                <span
                                    className={`${
                                        category.is_active ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                <button onClick={() => handleEditCategory(category)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200 hover:scale-110 active:scale-95" title="Edit Category">
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleRemoveCategory(category.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200 hover:scale-110 active:scale-95" title="Remove Category">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                      ))
                  ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                          {loading ? "Loading categories..." : isCategorySearching ? "No matching categories found." : "No categories found."}
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>

              {/* Category Modal */}
              {showCategoryModal && (
                  <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl max-w-md w-full animate-scale-in-subtle overflow-y-auto max-h-[90vh]">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{editingCategory ? "Edit Category" : "Add New Category"}</h3>
                        <button onClick={() => setShowCategoryModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200">
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <form onSubmit={handleSubmitCategory}>
                        <div className="mb-4">
                          <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
                          <input type="text" id="categoryName" name="name" value={categoryFormData.name} onChange={handleCategoryFormChange} required className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 animate-input-slide" />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                          <textarea id="categoryDescription" name="description" value={categoryFormData.description} onChange={handleCategoryFormChange} rows="3" className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 animate-input-slide"></textarea>
                        </div>
                        <div className="mb-4">
                          <label htmlFor="categoryIcon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon URL or Emoji</label>
                          <input type="text" id="categoryIcon" name="icon" value={categoryFormData.icon} onChange={handleCategoryFormChange} className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 animate-input-slide" placeholder="e.g., 🛒 or https://example.com/icon.png" />
                        </div>
                        <div className="mb-4 flex items-center">
                          <input type="checkbox" id="is_active_category" name="is_active" checked={categoryFormData.is_active} onChange={handleCategoryFormChange} className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600" />
                          <label htmlFor="is_active_category" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Is Active</label>
                        </div>
                        <div className="flex justify-end space-x-4">
                          <button type="button" onClick={() => setShowCategoryModal(false)} className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200 shadow-md transition-all duration-200 hover:scale-105 active:scale-95">Cancel</button>
                          <button type="submit" disabled={loading} className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95">{loading ? "Saving..." : editingCategory ? "Update Category" : "Add Category"}</button>
                        </div>
                      </form>
                    </div>
                  </div>
              )}
            </div>
        )}
      </AdminLayout>
  );
};

export default ProductManagement;
// CategoryManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
    PlusCircle,
    Edit,
    Trash2,
    Tag, // Category icon
    X, // Inactive status / close
    Check // Active status
} from "lucide-react";
import ConfirmationModal from "./ConfirmationModal"; // Import the ConfirmationModal
import CategoryModal from "./CategoryModal"; // Import the CategoryModal

const CategoryManagement = ({ showToast, getAuthHeaders, isDarkMode }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryFormData, setCategoryFormData] = useState({
        name: "",
        description: "",
        icon: "",
        is_active: true,
    });

    // Custom confirmation modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalMessage, setConfirmModalMessage] = useState("");
    const [confirmModalAction, setConfirmModalAction] = useState(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        console.log("[fetchCategories] Attempting to fetch categories...");
        const headers = getAuthHeaders();
        if (!headers) {
            setLoading(false);
            return;
        }

        try {
            const apiUrl = "http://localhost:3000/api/products/categories";
            console.log(`[fetchCategories] Fetching from: ${apiUrl}`);
            const response = await fetch(apiUrl, { headers });
            const data = await response.json();
            console.log("[fetchCategories] API Response:", data);

            if (response.ok) {
                setCategories(data || []);
                console.log("[fetchCategories] Categories set:", data || []);
            } else {
                showToast(data.message || "Failed to fetch categories.", "error");
                console.error("[fetchCategories] API Error:", data.message);
            }
        } catch (error) {
            console.error("[fetchCategories] Network error fetching categories:", error);
            showToast("Network error. Could not load categories.", "error");
        } finally {
            setLoading(false);
            console.log("[fetchCategories] Loading set to false.");
        }
    }, [getAuthHeaders, showToast]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleAddCategory = () => {
        console.log("[handleAddCategory] Opening add category modal.");
        setEditingCategory(null);
        setCategoryFormData({ name: "", description: "", icon: "", is_active: true });
        setShowCategoryModal(true);
    };

    const handleEditCategory = (category) => {
        console.log("[handleEditCategory] Opening edit category modal for ID:", category.id);
        setEditingCategory(category);
        setCategoryFormData({
            name: category.name,
            description: category.description,
            icon: category.icon,
            is_active: category.is_active,
        });
        setShowCategoryModal(true);
    };

    const handleSubmitCategory = async (formData) => {
        console.log("[handleSubmitCategory] Submitting category form...");
        setLoading(true);
        const headers = getAuthHeaders();
        if (!headers) {
            setLoading(false);
            return;
        }

        try {
            let response;
            if (editingCategory) {
                console.log(`[handleSubmitCategory] Editing category ID: ${editingCategory.id}`);
                response = await fetch(
                    `http://localhost:3000/api/admin/categories/${editingCategory.id}/edit`,
                    {
                        method: "PUT",
                        headers,
                        body: JSON.stringify(formData),
                    }
                );
            } else {
                console.log("[handleSubmitCategory] Adding new category.");
                response = await fetch("http://localhost:3000/api/admin/categories/add", {
                    method: "POST",
                    headers,
                    body: JSON.stringify(formData),
                });
            }
            const data = await response.json();
            console.log("[handleSubmitCategory] API Response:", data);

            if (data.success) {
                showToast(
                    editingCategory ? "Category updated successfully!" : "Category added successfully!",
                    "success"
                );
                setShowCategoryModal(false);
                fetchCategories(); // Refresh category list
                console.log("[handleSubmitCategory] Category saved successfully, refreshing list.");
            } else {
                showToast(data.message || "Failed to save category.", "error");
                console.error("[handleSubmitCategory] API Error:", data.message);
            }
        } catch (error) {
            console.error("[handleSubmitCategory] Network error saving category:", error);
            showToast("Network error. Could not save category.", "error");
        } finally {
            setLoading(false);
            console.log("[handleSubmitCategory] Loading set to false.");
        }
    };

    const handleRemoveCategory = (categoryId) => {
        console.log("[handleRemoveCategory] Initiating remove for category ID:", categoryId);
        setConfirmModalMessage(`Are you sure you want to remove category ID ${categoryId}? This cannot be undone.`);
        setConfirmModalAction(async () => {
            console.log("[handleRemoveCategory] Confirming category removal.");
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(
                    `http://localhost:3000/api/admin/categories/${categoryId}/remove`,
                    { method: "DELETE", headers }
                );
                const data = await response.json();
                console.log("[handleRemoveCategory] API Response:", data);

                if (data.success) {
                    showToast("Category removed successfully!", "success");
                    fetchCategories(); // Refresh category list
                    // Note: In a real app, you might also need to re-fetch products if categories are linked
                    console.log("[handleRemoveCategory] Category removed successfully, refreshing list.");
                } else {
                    showToast(data.message || "Failed to remove category.", "error");
                    console.error("[handleRemoveCategory] API Error:", data.message);
                }
            } catch (error) {
                console.error("[handleRemoveCategory] Network error removing category:", error);
                showToast("Network error. Could not remove category.", "error");
            } finally {
                setLoading(false);
                setShowConfirmModal(false);
                console.log("[handleRemoveCategory] Loading set to false, modal closed.");
            }
        });
        setShowConfirmModal(true);
    };

    return (
        <>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <svg
                        className="animate-spin h-10 w-10 text-purple-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Loading categories...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Category List</h2>
                        <button
                            onClick={handleAddCategory}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 shadow-md"
                        >
                            <PlusCircle className="w-5 h-5" />
                            <span>Add New Category</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Icon
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Active
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {category.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {category.icon ? (
                                                <img
                                                    src={category.icon}
                                                    alt={category.name}
                                                    className="h-8 w-8 object-contain rounded-md"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/32x32/E0E0E0/333333?text=Icon"; }}
                                                />
                                            ) : (
                                                <div className="h-8 w-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400">
                                                    <Tag className="w-4 h-4" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {category.name}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-700 dark:text-gray-300">
                                            {category.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {category.is_active ? (
                                                <Check className="w-5 h-5 text-green-500" title="Active" />
                                            ) : (
                                                <X className="w-5 h-5 text-red-500" title="Inactive" />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditCategory(category)}
                                                    className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                                                    title="Edit Category"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveCategory(category.id)}
                                                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
                                                    title="Remove Category"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                        No categories found.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Category Add/Edit Modal */}
            {showCategoryModal && (
                <CategoryModal
                    editingCategory={editingCategory}
                    categoryFormData={categoryFormData}
                    setCategoryFormData={setCategoryFormData}
                    handleSubmitCategory={handleSubmitCategory}
                    onClose={() => setShowCategoryModal(false)}
                    loading={loading}
                    isDarkMode={isDarkMode}
                />
            )}

            {/* Confirmation Modal (for category actions) */}
            {showConfirmModal && (
                <ConfirmationModal
                    message={confirmModalMessage}
                    onConfirm={confirmModalAction}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </>
    );
};

export default CategoryManagement;
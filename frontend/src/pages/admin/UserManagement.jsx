import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import {
  Users,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
  Trash2,
  CheckCircle,
  AlertCircle,
  Mail, // Import Mail icon
  Phone,
  Lock,
  Package, // For Products link
  UserCircle, // For Profile icon
} from "lucide-react";

const UserManagement = ({ isDarkMode, showToast, handleLogout }) => {
  const navigate = useNavigate();

  // State for dark mode
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("buyers"); // 'buyers', 'sellers', 'admins'

  // User data states
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [admins, setAdmins] = useState([]);

  // Pagination states
  const [buyerPage, setBuyerPage] = useState(1);
  const [buyerLimit, setBuyerLimit] = useState(20);
  const [buyerTotalPages, setBuyerTotalPages] = useState(1);
  const [buyerSearchTerm, setBuyerSearchTerm] = useState("");
  const [debouncedBuyerSearchTerm, setDebouncedBuyerSearchTerm] = useState(""); // Debounced state
  const [buyerFilterStatus, setBuyerFilterStatus] = useState("all"); // 'all', 'active', 'suspended'

  const [sellerPage, setSellerPage] = useState(1);
  const [sellerLimit, setSellerLimit] = useState(20);
  const [sellerTotalPages, setSellerTotalPages] = useState(1);
  const [sellerSearchTerm, setSellerSearchTerm] = useState("");
  const [debouncedSellerSearchTerm, setDebouncedSellerSearchTerm] = useState(""); // Debounced state
  const [sellerFilterStatus, setSellerFilterStatus] = useState("all"); // 'all', 'active, 'suspended'

  // Create Admin Modal states
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  // Bulk action states
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkActionType, setBulkActionType] = useState(""); // 'suspend', 'activate', 'delete'

  // Custom confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  // Stores the details needed for the action, not the action function itself
  const [pendingConfirmAction, setPendingConfirmAction] = useState(null); // { userId, actionType }

  // Email Modal States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalTargetUser, setEmailModalTargetUser] = useState(null); // For single user email: { id, email, name }
  const [emailModalTargetType, setEmailModalTargetType] = useState(""); // 'single', 'active_buyers', 'active_sellers'
  const [sendingEmail, setSendingEmail] = useState(false);


  // Apply dark mode class to HTML element


  // Debounce effect for buyer search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedBuyerSearchTerm(buyerSearchTerm);
    }, 500); // 500ms debounce delay
    return () => clearTimeout(timerId);
  }, [buyerSearchTerm]);

  // Debounce effect for seller search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSellerSearchTerm(sellerSearchTerm);
    }, 500); // 500ms debounce delay
    return () => clearTimeout(timerId);
  }, [sellerSearchTerm]);


  // Show toast notification

  // Generic fetch function for users
  const fetchUsers = useCallback(
      async (type, page = 1, limit = 20, searchTerm = "", statusFilter = "all") => {
        setLoading(true);
        console.log(`[fetchUsers] Fetching ${type} data. Page: ${page}, Limit: ${limit}, Search: "${searchTerm}", Status Filter: "${statusFilter}"`);
        const adminToken = localStorage.getItem("admin_token");
        if (!adminToken) {
          showToast("Authentication required. Please log in.", "error");
          navigate("/admin/login");
          setLoading(false);
          console.log("[fetchUsers] No admin token found, redirecting.");
          return;
        }

        const headers = {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        };

        let apiUrl = `http://localhost:3000/api/admin/users/${type}`;
        if (type !== "admins") {
          const params = new URLSearchParams();
          params.append("page", page);
          params.append("limit", limit);

          if (searchTerm) {
            params.append("search", searchTerm);
          }

          // Differentiate filter parameters based on user type (buyers vs. sellers)
          if (type === "buyers") {
            if (statusFilter === "suspended") {
              params.append("is_suspended", "1"); // For buyers, send is_suspended=1
            } else if (statusFilter === "active") {
              params.append("is_active", "1"); // For buyers, send is_active=1
              params.append("is_suspended", "0"); // And is_suspended=0
            }
          } else if (type === "sellers") {
            if (statusFilter === "suspended") {
              params.append("status", "suspended"); // For sellers, send status=suspended
            } else if (statusFilter === "active") {
              params.append("status", "active"); // For sellers, send status=active
            }
          }
          // If statusFilter is "all", no status parameters are appended, which is correct.

          apiUrl += `?${params.toString()}`;
        }
        console.log(`[fetchUsers] Constructed API URL: ${apiUrl}`);

        try {
          const response = await fetch(apiUrl, { headers });
          const data = await response.json();
          console.log(`[fetchUsers] Raw API Response for ${type}:`, data); // Log raw response

          if (data.success) {
            if (type === "buyers") {
              setBuyers(data.data.buyers);
              setBuyerTotalPages(data.data.pagination.totalPages);
              setBuyerPage(data.data.pagination.page);
            } else if (type === "sellers") {
              setSellers(data.data.sellers);
              setSellerTotalPages(data.data.pagination.totalPages);
              setSellerPage(data.data.pagination.page);
            } else if (type === "admins") {
              setAdmins(data.data);
            }
            console.log(`[fetchUsers] Successfully updated ${type} state with filtered data.`);
          } else {
            showToast(data.message || `Failed to fetch ${type}.`, "error");
            console.error(`[fetchUsers] API Error for ${type}:`, data.message);
          }
        } catch (error) {
          console.error(`[fetchUsers] Network error fetching ${type}:`, error);
          showToast(`Network error. Could not load ${type} data.`, "error");
        } finally {
          setLoading(false);
          console.log(`[fetchUsers] Loading set to false for ${type}.`);
        }
      },
      [navigate]
  );

  // Effect to fetch data based on active tab and pagination/debounced search
  useEffect(() => {
    console.log(`[useEffect] Active tab changed to: ${activeTab}. Initiating data fetch.`);
    if (activeTab === "buyers") {
      fetchUsers("buyers", buyerPage, buyerLimit, debouncedBuyerSearchTerm, buyerFilterStatus); // Use debounced term and filter status
    } else if (activeTab === "sellers") {
      fetchUsers("sellers", sellerPage, sellerLimit, debouncedSellerSearchTerm, sellerFilterStatus); // Use debounced term and filter status
    } else if (activeTab === "admins") {
      fetchUsers("admins");
    }
  }, [activeTab, buyerPage, buyerLimit, debouncedBuyerSearchTerm, buyerFilterStatus, sellerPage, sellerLimit, debouncedSellerSearchTerm, sellerFilterStatus, fetchUsers]);

  // Handle pagination change for buyers
  const handleBuyerPageChange = (newPage) => {
    console.log(`[Pagination] Changing buyer page to: ${newPage}`);
    if (newPage > 0 && newPage <= buyerTotalPages) {
      setBuyerPage(newPage);
    }
  };

  // Handle pagination change for sellers
  const handleSellerPageChange = (newPage) => {
    console.log(`[Pagination] Changing seller page to: ${newPage}`);
    if (newPage > 0 && newPage <= sellerTotalPages) {
      setSellerPage(newPage);
    }
  };

  // Function to execute the confirmed action (suspend, activate, remove)
  const executeConfirmedAction = useCallback(async () => {
    if (!pendingConfirmAction) {
      console.warn("[executeConfirmedAction] No pending action to execute.");
      return;
    }

    const { userId, actionType } = pendingConfirmAction;
    console.log(`[executeConfirmedAction] Executing action: ${actionType} for user ID: ${userId}`);

    const actionMap = {
      suspend: {
        method: "PUT",
        url: `/api/admin/users/${userId}/suspend`,
        successMsg: `User ID ${userId} suspended successfully.`,
        errorMsg: `Failed to suspend user ID ${userId}.`,
      },
      activate: {
        method: "PUT",
        url: `/api/admin/users/${userId}/activate`,
        successMsg: `User ID ${userId} activated successfully.`,
        errorMsg: `Failed to activate user ID ${userId}.`,
      },
      remove: {
        method: "DELETE",
        url: `/api/admin/users/${userId}/remove`,
        successMsg: `User ID ${userId} removed successfully.`,
        errorMsg: `Failed to remove user ID ${userId}.`,
      },
    };

    const { method, url, successMsg, errorMsg } = actionMap[actionType];

    setLoading(true);
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      showToast("Authentication required. Please log in.", "error");
      navigate("/admin/login");
      setLoading(false);
      console.log("[executeConfirmedAction] No admin token found, redirecting.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000${url}`, {
        method: method,
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log(`[executeConfirmedAction] API Response for ${actionType}:`, data);

      if (data.success) {
        showToast(successMsg, "success");
        // Re-fetch data for the active tab to reflect changes
        console.log(`[executeConfirmedAction] Action successful, re-fetching data for ${activeTab}.`);
        if (activeTab === "buyers") {
          fetchUsers("buyers", buyerPage, buyerLimit, debouncedBuyerSearchTerm, buyerFilterStatus);
        } else if (activeTab === "sellers") {
          fetchUsers("sellers", sellerPage, sellerLimit, debouncedSellerSearchTerm, sellerFilterStatus);
        } else if (activeTab === "admins") {
          fetchUsers("admins");
        }
      } else {
        showToast(data.message || errorMsg, "error");
        console.error(`[executeConfirmedAction] API Error for ${actionType}:`, data.message);
      }
    } catch (error) {
      console.error(`[executeConfirmedAction] Network error during ${actionType} action:`, error);
      showToast(`Network error during ${actionType}. Please try again.`, "error");
    } finally {
      setLoading(false);
      setShowConfirmModal(false); // Close modal
      setPendingConfirmAction(null); // Clear pending action
      console.log(`[executeConfirmedAction] Loading set to false, modal closed, pending action cleared.`);
    }
  }, [navigate, showToast, activeTab, fetchUsers, buyerPage, buyerLimit, debouncedBuyerSearchTerm, buyerFilterStatus, sellerPage, sellerLimit, debouncedSellerSearchTerm, sellerFilterStatus, pendingConfirmAction]);


  // Handle individual user actions (suspend, activate, remove) - now only sets up confirmation
  const handleUserAction = (userId, actionType) => {
    console.log(`[handleUserAction] Preparing action: ${actionType} for user ID: ${userId}`);
    const actionMap = {
      suspend: `Are you sure you want to suspend user ID ${userId}?`,
      activate: `Are you sure you want to activate user ID ${userId}?`,
      remove: `Are you sure you want to permanently remove user ID ${userId}? This cannot be undone.`,
    };

    setConfirmModalMessage(actionMap[actionType]);
    setPendingConfirmAction({ userId, actionType }); // Store action details
    setShowConfirmModal(true); // This opens the confirmation modal
    console.log("[handleUserAction] Confirmation modal opened with pending action.");
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    console.log(`[handleBulkAction] Attempting bulk action: ${bulkActionType} for user IDs:`, selectedUserIds);
    if (selectedUserIds.length === 0 || !bulkActionType) {
      showToast("Please select users and an action.", "error");
      console.warn("[handleBulkAction] No users selected or no action type.");
      return;
    }

    const actionMsgMap = {
      suspend: "suspend",
      activate: "activate",
      delete: "permanently delete",
    };

    setConfirmModalMessage(
        `Are you sure you want to ${actionMsgMap[bulkActionType]} ${selectedUserIds.length} selected users?`
    );
    // For bulk actions, we can directly set the action to be executed,
    // or refactor it similarly to individual actions if needed.
    // For now, let's keep it as is, assuming the current bulk action confirmation works.
    setPendingConfirmAction({ userIds: selectedUserIds, actionType: bulkActionType, isBulk: true });
    setShowConfirmModal(true);
    console.log("[handleBulkAction] Confirmation modal opened.");
  };

  // Function to execute bulk confirmed action
  const executeConfirmedBulkAction = useCallback(async () => {
    if (!pendingConfirmAction || !pendingConfirmAction.isBulk) {
      console.warn("[executeConfirmedBulkAction] No pending bulk action to execute.");
      return;
    }

    const { userIds, actionType } = pendingConfirmAction;
    console.log(`[executeConfirmedBulkAction] Executing bulk action: ${actionType} for user IDs:`, userIds);

    setLoading(true);
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      showToast("Authentication required. Please log in.", "error");
      navigate("/admin/login");
      setLoading(false);
      console.log("[executeConfirmedBulkAction] No admin token found, redirecting.");
      return;
    }

    try {
      const response = await fetch(
          "http://localhost:3000/api/admin/users/bulk-action",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${adminToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ action: actionType, user_ids: userIds }),
          }
      );
      const data = await response.json();
      console.log(`[executeConfirmedBulkAction] API Response for bulk action:`, data);

      if (data.success) {
        showToast(`${data.data.affectedRows} users ${actionType}d successfully.`, "success");
        setSelectedUserIds([]); // Clear selections
        // Re-fetch data for the active tab to reflect changes
        console.log(`[executeConfirmedBulkAction] Bulk action successful, re-fetching data for ${activeTab}.`);
        if (activeTab === "buyers") {
          fetchUsers("buyers", buyerPage, buyerLimit, debouncedBuyerSearchTerm, buyerFilterStatus);
        } else if (activeTab === "sellers") {
          fetchUsers("sellers", sellerPage, sellerLimit, debouncedSellerSearchTerm, sellerFilterStatus);
        } else if (activeTab === "admins") {
          fetchUsers("admins");
        }
      } else {
        showToast(data.message || "Bulk action failed.", "error");
        console.error(`[executeConfirmedBulkAction] API Error for bulk action:`, data.message);
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
      showToast("Network error during bulk action. Please try again.", "error");
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setPendingConfirmAction(null); // Clear pending action
      console.log(`[executeConfirmedBulkAction] Loading set to false, modal closed.`);
    }
  }, [navigate, showToast, activeTab, fetchUsers, buyerPage, buyerLimit, debouncedBuyerSearchTerm, buyerFilterStatus, sellerPage, sellerLimit, debouncedSellerSearchTerm, sellerFilterStatus, pendingConfirmAction]);


  // Handle checkbox selection for bulk actions
  const handleUserSelect = (userId) => {
    setSelectedUserIds((prevSelected) => {
      const newSelection = prevSelected.includes(userId)
          ? prevSelected.filter((id) => id !== userId)
          : [...prevSelected, userId];
      console.log("[handleUserSelect] Selected IDs:", newSelection);
      return newSelection;
    });
  };

  // Handle "Select All" checkbox
  const handleSelectAll = (users) => {
    if (selectedUserIds.length === users.length && users.length > 0) {
      setSelectedUserIds([]);
      console.log("[handleSelectAll] Deselecting all.");
    } else {
      const allIds = users.map((user) => user.id);
      setSelectedUserIds(allIds);
      console.log("[handleSelectAll] Selecting all IDs:", allIds);
    }
  };

  // Handle create admin form change
  const handleNewAdminChange = (e) => {
    const { name, value } = e.target;
    setNewAdminData((prev) => ({ ...prev, [name]: value }));
    console.log(`[handleNewAdminChange] ${name}: ${value}`);
  };

  // Handle create admin submission
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    console.log("[handleCreateAdmin] Attempting to create new admin.");
    setLoading(true);
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      showToast("Authentication required. Please log in.", "error");
      navigate("/admin/login");
      setLoading(false);
      console.log("[handleCreateAdmin] No admin token found, redirecting.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/admin/create-admin", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAdminData),
      });
      const data = await response.json();
      console.log("[handleCreateAdmin] API Response:", data);

      if (data.success) {
        showToast(`Admin created with ID: ${data.data.adminId}`, "success");
        setShowCreateAdminModal(false);
        setNewAdminData({ name: "", email: "", phone: "", password: "" });
        fetchUsers("admins"); // Refresh admin list
        console.log("[handleCreateAdmin] Admin created successfully, refreshing admin list.");
      } else {
        showToast(data.message || "Failed to create admin.", "error");
        console.error("[handleCreateAdmin] API Error:", data.message);
      }
    } catch (error) {
      console.error("[handleCreateAdmin] Network error creating admin:", error);
      showToast("Network error. Could not create admin.", "error");
    } finally {
      setLoading(false);
      console.log("[handleCreateAdmin] Loading set to false.");
    }
  };



  // --- Email Sending Functions ---
  const openEmailModalForSingleUser = (user) => {
    setEmailModalTargetUser(user);
    setEmailModalTargetType("single");
    setShowEmailModal(true);
    console.log("[EmailModal] Opening for single user:", user.email);
  };

  const openEmailModalForBulk = (type) => {
    setEmailModalTargetUser(null); // Clear single user target
    setEmailModalTargetType(type); // 'active_buyers' or 'active_sellers'
    setShowEmailModal(true);
    console.log("[EmailModal] Opening for bulk type:", type);
  };

  // Modified handleSendEmail to accept arguments from EmailModal's local state
  const handleSendEmail = async (subject, bodyText, imageUrl) => {
    console.log("[handleSendEmail] Attempting to send email.");
    setSendingEmail(true);
    const adminToken = localStorage.getItem("admin_token");

    if (!adminToken) {
      showToast("Authentication required. Please log in.", "error");
      navigate("/admin/login");
      setSendingEmail(false);
      console.log("[handleSendEmail] No admin token found, redirecting.");
      return;
    }

    if (!subject || !bodyText) {
      showToast("Subject and Body are required for the email.", "error");
      setSendingEmail(false);
      return;
    }

    const payload = {
      targetType: emailModalTargetType,
      subject: subject,
      bodyText: bodyText,
      imageUrl: imageUrl,
    };

    if (emailModalTargetType === "single" && emailModalTargetUser) {
      payload.userId = emailModalTargetUser.id;
    }

    console.log("[handleSendEmail] Sending payload:", payload);

    try {
      const response = await fetch("http://localhost:3000/api/admin/send-custom-email", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log("[handleSendEmail] API Response:", data);

      if (data.success) {
        showToast(data.message, "success");
        setShowEmailModal(false); // Close modal on success
        setEmailModalTargetUser(null); // Reset target user
        setEmailModalTargetType(""); // Reset target type
        console.log("[handleSendEmail] Email sent successfully, modal closed.");
      } else {
        showToast(data.message || "Failed to send email.", "error");
        console.error("[handleSendEmail] API Error:", data.message);
      }
    } catch (error) {
      console.error("[handleSendEmail] Network error sending email:", error);
      showToast("Network error. Could not send email.", "error");
    } finally {
      setSendingEmail(false);
      console.log("[handleSendEmail] Sending email loading set to false.");
    }
  };
  // --- End Email Sending Functions ---


  // Custom Confirmation Modal Component
  const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl max-w-sm w-full text-center animate-scale-in-subtle">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{message}</p>
          <div className="flex justify-center space-x-4">
            <button
                onClick={() => {
                  console.log("[ConfirmationModal] Confirm button clicked.");
                  onConfirm(); // This now calls the executeConfirmedAction or executeConfirmedBulkAction
                }}
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 shadow-md"
            >
              Confirm
            </button>
            <button
                onClick={() => {
                  console.log("[ConfirmationModal] Cancel button clicked.");
                  onCancel();
                }}
                className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200 shadow-md"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
  );

  // Email Composition Modal Component
  const EmailModal = ({
                        show,
                        onClose,
                        targetUser,
                        targetType,
                        onSend, // This now expects a function that takes subject, bodyText, imageUrl
                        isSending,
                      }) => {
    // Local states for the form inputs within the modal
    const [localSubject, setLocalSubject] = useState("");
    const [localBodyText, setLocalBodyText] = useState("");
    const [localImageUrl, setLocalImageUrl] = useState("");

    // Reset local states when modal opens or target changes
    useEffect(() => {
      if (show) {
        setLocalSubject("");
        setLocalBodyText("");
        setLocalImageUrl("");
      }
    }, [show, targetUser, targetType]);


    if (!show) return null;

    const modalTitle = targetType === "single"
        ? `Send Email to ${targetUser?.name || "User"}`
        : `Send Email to All Active ${targetType === "active_buyers" ? "Buyers" : "Sellers"}`;

    const handleSubmit = (e) => {
      e.preventDefault();
      onSend(localSubject, localBodyText, localImageUrl); // Pass local states to parent handler
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl max-w-lg w-full animate-scale-in-subtle">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              {modalTitle}
            </h2>
            <form onSubmit={handleSubmit}>
              {targetUser && (
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                      Recipient:
                    </label>
                    <input
                        type="text"
                        value={`${targetUser.name} (${targetUser.email})`}
                        className="pl-4 pr-4 py-2 w-full border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                        disabled
                    />
                  </div>
              )}

              <div className="mb-4">
                <label
                    htmlFor="emailSubject"
                    className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                >
                  Subject
                </label>
                <input
                    type="text"
                    id="emailSubject"
                    name="emailSubject"
                    value={localSubject}
                    onChange={(e) => setLocalSubject(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                    placeholder="Email Subject"
                    required
                />
              </div>

              <div className="mb-4">
                <label
                    htmlFor="emailBodyText"
                    className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                >
                  Body
                </label>
                <textarea
                    id="emailBodyText"
                    name="emailBodyText"
                    value={localBodyText}
                    onChange={(e) => setLocalBodyText(e.target.value)}
                    rows="6"
                    className="pl-10 pr-4 py-2 w-full border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                    placeholder="Your email content here..."
                    required
                ></textarea>
              </div>

              <div className="mb-6">
                <label
                    htmlFor="emailImageUrl"
                    className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                >
                  Image URL (Optional)
                </label>
                <input
                    type="url"
                    id="emailImageUrl"
                    name="emailImageUrl"
                    value={localImageUrl}
                    onChange={(e) => setLocalImageUrl(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                    placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200 shadow-md"
                >
                  Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSending}
                    className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
    );
  };


  return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 relative">
          {/* Toast Notification */}


          {/* Confirmation Modal */}
          {showConfirmModal && (
              <ConfirmationModal
                  message={confirmModalMessage}
                  onConfirm={pendingConfirmAction?.isBulk ? executeConfirmedBulkAction : executeConfirmedAction}
                  onCancel={() => {
                    setShowConfirmModal(false);
                    setPendingConfirmAction(null); // Clear pending action on cancel
                    console.log("[UserManagement] Confirmation modal closed via external cancel.");
                  }}
              />
          )}

          {/* Email Composition Modal */}
          <EmailModal
              show={showEmailModal}
              onClose={() => {
                setShowEmailModal(false);
                setSendingEmail(false); // Ensure sending state is reset
              }}
              targetUser={emailModalTargetUser}
              targetType={emailModalTargetType}
              onSend={handleSendEmail} // Now passes the function directly
              isSending={sendingEmail}
          />


          <div className="p-4 sm:p-6 lg:p-8">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button
                  className={`py-3 px-6 text-lg font-medium ${
                      activeTab === "buyers"
                          ? "text-purple-700 dark:text-purple-400 border-b-2 border-purple-700 dark:border-purple-400"
                          : "text-gray-600 dark:text-gray-400 hover:text-purple-700 dark:hover:text-purple-300"
                  } transition-colors duration-200`}
                  onClick={() => setActiveTab("buyers")}
              >
                Buyers
              </button>
              <button
                  className={`py-3 px-6 text-lg font-medium ${
                      activeTab === "sellers"
                          ? "text-purple-700 dark:text-purple-400 border-b-2 border-purple-700 dark:border-purple-400"
                          : "text-gray-600 dark:text-gray-400 hover:text-purple-700 dark:hover:text-purple-300"
                  } transition-colors duration-200`}
                  onClick={() => setActiveTab("sellers")}
              >
                Sellers
              </button>
              <button
                  className={`py-3 px-6 text-lg font-medium ${
                      activeTab === "admins"
                          ? "text-purple-700 dark:text-purple-400 border-b-2 border-purple-700 dark:border-purple-400"
                          : "text-gray-600 dark:text-gray-400 hover:text-purple-700 dark:hover:text-purple-300"
                  } transition-colors duration-200`}
                  onClick={() => setActiveTab("admins")}
              >
                Admins
              </button>
            </div>

            {/* Content based on active tab */}
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
                  <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Loading users...</p>
                </div>
            ) : (
                <>
                  {activeTab === "buyers" && (
                      <UserTable
                          users={buyers}
                          title="Buyer Accounts"
                          pagination={{
                            currentPage: buyerPage,
                            totalPages: buyerTotalPages,
                            onPageChange: handleBuyerPageChange,
                          }}
                          searchTerm={buyerSearchTerm} // Pass non-debounced term for input value
                          onSearchChange={setBuyerSearchTerm} // Update non-debounced term
                          statusFilter={buyerFilterStatus} // Pass current filter status
                          onStatusFilterChange={setBuyerFilterStatus} // Pass setter for status filter
                          onUserAction={handleUserAction}
                          selectedUserIds={selectedUserIds}
                          onUserSelect={handleUserSelect}
                          onSelectAll={handleSelectAll}
                          onBulkAction={handleBulkAction}
                          setBulkActionType={setBulkActionType}
                          showBulkActions={true}
                          onSendEmail={openEmailModalForSingleUser} // Pass email function
                          onSendAllEmail={() => openEmailModalForBulk("active_buyers")} // Pass send all function
                      />
                  )}

                  {activeTab === "sellers" && (
                      <UserTable
                          users={sellers}
                          title="Seller Accounts"
                          pagination={{
                            currentPage: sellerPage,
                            totalPages: sellerTotalPages,
                            onPageChange: handleSellerPageChange,
                          }}
                          searchTerm={sellerSearchTerm} // Pass non-debounced term for input value
                          onSearchChange={setSellerSearchTerm} // Update non-debounced term
                          statusFilter={sellerFilterStatus} // Pass current filter status
                          onStatusFilterChange={setSellerFilterStatus} // Pass setter for status filter
                          onUserAction={handleUserAction}
                          selectedUserIds={selectedUserIds}
                          onUserSelect={handleUserSelect}
                          onSelectAll={handleSelectAll}
                          onBulkAction={handleBulkAction}
                          setBulkActionType={setBulkActionType}
                          showBulkActions={true}
                          onSendEmail={openEmailModalForSingleUser} // Pass email function
                          onSendAllEmail={() => openEmailModalForBulk("active_sellers")} // Pass send all function
                      />
                  )}

                  {activeTab === "admins" && (
                      <AdminTable
                          admins={admins}
                          title="Admin Accounts"
                          onUserAction={handleUserAction}
                          onCreateAdmin={() => setShowCreateAdminModal(true)}
                      />
                  )}
                </>
            )}
          </div>

          {/* Create Admin Modal */}
          {showCreateAdminModal && (
              <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl max-w-md w-full animate-scale-in-subtle">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    Create New Admin
                  </h2>
                  <form onSubmit={handleCreateAdmin}>
                    <div className="mb-4">
                      <label
                          htmlFor="name"
                          className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                      >
                        Name
                      </label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={newAdminData.name}
                            onChange={handleNewAdminChange}
                            className="pl-10 pr-4 py-2 w-full border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                            placeholder="Admin Name"
                            required
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label
                          htmlFor="email"
                          className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={newAdminData.email}
                            onChange={handleNewAdminChange}
                            className="pl-10 pr-4 py-2 w-full border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                            placeholder="admin@example.com"
                            required
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label
                          htmlFor="phone"
                          className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                      >
                        Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={newAdminData.phone}
                            onChange={handleNewAdminChange}
                            className="pl-10 pr-4 py-2 w-full border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                            placeholder="e.g., +1234567890"
                            required
                        />
                      </div>
                    </div>
                    <div className="mb-6">
                      <label
                          htmlFor="password"
                          className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={newAdminData.password}
                            onChange={handleNewAdminChange}
                            className="pl-10 pr-4 py-2 w-full border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                            placeholder="********"
                            required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button
                          type="button"
                          onClick={() => {
                            setShowCreateAdminModal(false);
                            console.log("[CreateAdminModal] Cancel button clicked.");
                          }}
                          className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200 shadow-md"
                      >
                        Cancel
                      </button>
                      <button
                          type="submit"
                          disabled={loading}
                          className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Creating..." : "Create Admin"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
          )}

          {/* Tailwind CSS animations and custom keyframes (Copied for consistency) */}
          <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes scaleInSubtle {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        @keyframes inputSlide {
            from { transform: translateX(-10px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes buttonPop {
            0% { transform: scale(0.98); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
        @keyframes iconBounceSubtle {
            0%, 100% { transform: translateY(-50%); }
            25% { transform: translateY(-60%); }
            50% { transform: translateY(-50%); }
            75% { transform: translateY(-40%); }
        }

        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards; }
        .animate-scale-in-subtle { animation: scaleInSubtle 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        .animate-bounce-subtle { animation: bounce-subtle 3s infinite ease-in-out; }

        .animate-input-slide { animation: inputSlide 0.5s ease-out forwards; animation-delay: 0.2s; }
        .animate-button-pop { animation: buttonPop 0.4s ease-out; }
        .animate-icon-bounce-subtle { animation: iconBounceSubtle 2s infinite ease-in-out; }

        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }

        .text-shadow-lg {
            text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
        }

        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
            background: ${isDarkMode ? '#374151' : '#f1f1f1'}; /* gray-700 / gray-100 */
            border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${isDarkMode ? '#6B7280' : '#888'}; /* gray-500 / gray-600 */
            border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${isDarkMode ? '#9CA3AF' : '#555'}; /* gray-400 / gray-700 */
        }
      `}</style>
        </div>
      </AdminLayout>
  );

};

// Reusable User Table Component for Buyers and Sellers
const UserTable = ({
                     users,
                     title,
                     pagination,
                     searchTerm, // This is now the non-debounced term for input value
                     onSearchChange,
                     statusFilter, // New prop for status filter value
                     onStatusFilterChange, // New prop for status filter setter
                     onUserAction,
                     selectedUserIds,
                     onUserSelect,
                     onSelectAll,
                     onBulkAction,
                     setBulkActionType,
                     showBulkActions = false,
                     onSendEmail, // New prop for individual email
                     onSendAllEmail, // New prop for send all email
                   }) => {
  const isDarkMode = document.documentElement.classList.contains("dark");

  return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative w-full sm:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                placeholder={`Search ${title.toLowerCase().replace(" accounts", "")}...`}
                value={searchTerm} // Use the non-debounced searchTerm for immediate input feedback
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
            />
          </div>

          {/* New Status Filter Dropdown */}
          <div className="w-full sm:w-auto">
            <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white text-sm focus:ring-purple-500 focus:border-purple-500 w-full sm:min-w-fit"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {showBulkActions && (
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-2/3 justify-end">
                <select
                    onChange={(e) => setBulkActionType(e.target.value)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-800 dark:text-white text-sm focus:ring-purple-500 focus:border-purple-500 w-full sm:w-auto"
                >
                  <option value="">Bulk Actions</option>
                  <option value="suspend">Suspend Selected</option>
                  <option value="activate">Activate Selected</option>
                  <option value="delete">Delete Selected</option>
                </select>
                <button
                    onClick={onBulkAction}
                    disabled={selectedUserIds.length === 0}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  Apply
                </button>
                {/* Send All Email Button */}
                <button
                    onClick={onSendAllEmail}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center space-x-2 w-full sm:w-auto"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send All</span>
                </button>
              </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 dark:from-indigo-700 dark:via-purple-800 dark:to-violet-900 shadow-md shadow-purple-300/40 dark:shadow-purple-800/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg">
                <input
                    type="checkbox"
                    className="rounded text-purple-600 focus:ring-purple-500 dark:bg-gray-600 dark:border-gray-500"
                    checked={selectedUserIds.length === users.length && users.length > 0}
                    onChange={() => onSelectAll(users)}
                />
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-lg">Actions</th>
            </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.length > 0 ? (
                users.map((user) => (
                    <tr
                        key={user.id}
                        className="bg-gradient-to-r from-white to-purple-50 dark:from-gray-800 dark:to-gray-700 hover:from-purple-50 hover:to-purple-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                            type="checkbox"
                            className="rounded text-purple-600 focus:ring-purple-500 dark:bg-gray-600 dark:border-gray-500"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => onUserSelect(user.id)}
                        />
                      </td>


                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
              <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_suspended
                          ? "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"
                          : "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                  }`}
              >
                {user.is_suspended ? "Suspended" : "Active"}
              </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* Email Icon */}
                          <button
                              onClick={() => onSendEmail(user)}
                              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                              title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                              onClick={() => onUserAction(user.id, user.is_suspended ? "activate" : "suspend")}
                              className={`p-2 rounded-full ${
                                  user.is_suspended
                                      ? "bg-green-500 hover:bg-green-600"
                                      : "bg-orange-500 hover:bg-orange-600"
                              } text-white transition-colors duration-200`}
                              title={user.is_suspended ? "Activate User" : "Suspend User"}
                          >
                            {user.is_suspended ? (
                                <UserCheck className="w-4 h-4" />
                            ) : (
                                <UserX className="w-4 h-4" />
                            )}
                          </button>
                          <button
                              onClick={() => onUserAction(user.id, "remove")}
                              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
                              title="Remove User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                ))
            ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No users found.
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>


        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <button
                  onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>
              <span className="text-gray-700 dark:text-gray-300">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
              <button
                  onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
        )}
      </div>
  );
};

// Admin Table Component (no bulk actions or search, but has create admin button)
const AdminTable = ({ admins, title, onUserAction, onCreateAdmin }) => {
  const isDarkMode = document.documentElement.classList.contains("dark");

  return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
              onClick={onCreateAdmin}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 shadow-md"
          >
            <UserPlus className="w-5 h-5" />
            <span>Create New Admin</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            {/* Purple Thead */}
            <thead className="bg-gradient-to-r from-purple-500 to-purple-700 text-white">
            <tr>

              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tr-lg">
                Actions
              </th>
            </tr>
            </thead>

            {/* Tbody with hover effect */}
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {admins.length > 0 ? (
                admins.map((admin) => (
                    <tr
                        key={admin.id}
                        className="hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-colors duration-200"
                    >
                      {/* Purple text for ID */}

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {admin.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {admin.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {admin.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
              <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      admin.is_suspended
                          ? "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"
                          : "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                  }`}
              >
                {admin.is_suspended ? "Suspended" : "Active"}
              </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                              onClick={() =>
                                  onUserAction(admin.id, admin.is_suspended ? "activate" : "suspend")
                              }
                              className={`p-2 rounded-full ${
                                  admin.is_suspended
                                      ? "bg-green-500 hover:bg-green-600"
                                      : "bg-orange-500 hover:bg-orange-600"
                              } text-white transition-colors duration-200`}
                              title={admin.is_suspended ? "Activate Admin" : "Suspend Admin"}
                          >
                            {admin.is_suspended ? (
                                <UserCheck className="w-4 h-4" />
                            ) : (
                                <UserX className="w-4 h-4" />
                            )}
                          </button>
                          <button
                              onClick={() => onUserAction(admin.id, "remove")}
                              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
                              title="Remove Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                ))
            ) : (
                <tr>
                  <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No admin accounts found.
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>

      </div>
  );
};
export default UserManagement;

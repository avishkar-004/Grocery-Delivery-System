import React, { useState, useEffect, useCallback, useRef } from "react";
import { io } from 'socket.io-client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Edit, Trash2, Loader2, AlertCircle, Package, X, Check, MessageSquare, Send, List, Info
} from "lucide-react";
import sellerAPI from '@/data/sellerAPI';
import { useToast } from '@/components/ui/use-toast';
import { cn } from "@/lib/utils";

const API_BASE_URL = 'http://localhost:3000'; // Your backend URL
const socket = io(API_BASE_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket"],
});

// =====================================================================================
// NEW: Combined Chat and Edit/View Modal Component
// This component is now responsive and handles both editing and viewing details.
// =====================================================================================
const ChatAndDetailsModal = ({
                               isOpen,
                               onClose,
                               quotationId,
                               onQuotationUpdate,
                               chatMessages,
                               newMessage,
                               setNewMessage,
                               handleSendMessage,
                               loadingChat,
                               chatError,
                               sellerUser
                             }) => {
  if (!isOpen) return null;

  const [details, setDetails] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [activeTab, setActiveTab] = useState('details'); // For mobile view: 'details' or 'chat'

  const { toast } = useToast();
  const chatMessagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [panelWidth, setPanelWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const isEditable = details?.status === 'pending';

  // Fetch full quotation details when modal opens
  useEffect(() => {
    if (quotationId) {
      const fetchDetails = async () => {
        setIsLoading(true);
        const response = await sellerAPI.getQuotationDetails(quotationId);
        if (response.success && response.data) {
          setDetails(response.data);
          // Create a deep copy for the editable draft
          setDraft(JSON.parse(JSON.stringify(response.data)));
        } else {
          toast({ title: "Error", description: "Failed to load quotation details.", variant: "destructive" });
          onClose();
        }
        setIsLoading(false);
      };
      fetchDetails();
    }
  }, [quotationId, toast, onClose]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // --- Panel Resizing Logic ---
  const handleMouseDown = (e) => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    setPanelWidth(Math.max(30, Math.min(70, newWidth)));
  }, [isDragging]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  // --- Edit Handlers ---
  const handleDraftChange = (index, field, value) => {
    setDraft(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const calculateTotal = (items, discount) => {
    let total = (items || []).reduce((sum, item) => {
      const price = parseFloat(item.price_per_unit) || 0;
      const qty = Math.min(parseInt(item.available_quantity) || 0, parseInt(item.requested_quantity) || 0);
      return sum + (price * qty);
    }, 0);
    return Math.max(0, total - (parseFloat(discount) || 0));
  };

  const handleSaveChanges = async () => {
    if (!isEditable || !draft) return;

    // Validation
    let errors = {};
    let isValid = true;
    draft.items.forEach(item => {
      if (!item.price_per_unit || parseFloat(item.price_per_unit) <= 0) {
        errors[item.order_item_id] = "Price must be a positive number.";
        isValid = false;
      }
      if (item.available_quantity === '' || parseInt(item.available_quantity) < 0) {
        errors[item.order_item_id] = "Available quantity is required.";
        isValid = false;
      }
    });
    setValidationErrors(errors);

    if (!isValid) {
      toast({ title: "Validation Error", description: "Please check your inputs.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const payload = {
      items: draft.items.map(item => ({
        order_item_id: item.order_item_id,
        price_per_unit: parseFloat(item.price_per_unit),
        available_quantity: parseInt(item.available_quantity)
      })),
      discount: parseFloat(draft.discount) || 0,
      notes: draft.notes
    };

    const response = await sellerAPI.editQuotation(quotationId, payload);
    if (response.success) {
      toast({ title: "Success", description: "Quotation updated successfully!" });
      onQuotationUpdate(); // Callback to refresh the main list
      onClose();
    } else {
      toast({ title: "Error", description: response.message || "Failed to update quotation.", variant: "destructive" });
    }
    setIsSaving(false);
  };

  const DetailsPanel = () => (
      <div className="overflow-y-auto pr-3 custom-scrollbar h-full">
        <h3 className="text-lg font-semibold mb-3">Quotation Details</h3>
        {draft.items.map((item, index) => (
            <Card key={item.order_item_id} className="mb-3 p-3">
              <p className="font-semibold">{item.product_name}</p>
              <p className="text-xs text-muted-foreground mb-2">Requested: {item.requested_quantity} {item.unit_type}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`price-${item.order_item_id}`}>Price/Unit (₹)</Label>
                  <Input
                      id={`price-${item.order_item_id}`}
                      type="number"
                      value={draft.items[index].price_per_unit || ''}
                      onChange={(e) => handleDraftChange(index, 'price_per_unit', e.target.value)}
                      disabled={!isEditable}
                      className={cn(validationErrors[item.order_item_id] && 'border-destructive')}
                  />
                </div>
                <div>
                  <Label htmlFor={`qty-${item.order_item_id}`}>Available Qty</Label>
                  <Input
                      id={`qty-${item.order_item_id}`}
                      type="number"
                      value={draft.items[index].available_quantity || ''}
                      onChange={(e) => handleDraftChange(index, 'available_quantity', e.target.value)}
                      disabled={!isEditable}
                      className={cn(validationErrors[item.order_item_id] && 'border-destructive')}
                  />
                </div>
              </div>
            </Card>
        ))}
        <div className="mt-4 pt-4 border-t space-y-3">
          <div>
            <Label htmlFor="discount">Discount (₹)</Label>
            <Input id="discount" type="number" value={draft.discount || ''} onChange={(e) => setDraft({...draft, discount: e.target.value})} disabled={!isEditable} />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={draft.notes || ''} onChange={(e) => setDraft({...draft, notes: e.target.value})} disabled={!isEditable} />
          </div>
          <div className="p-3 bg-muted rounded-md text-right">
            <p className="text-sm">New Total</p>
            <p className="text-2xl font-bold text-seller-accent">₹{calculateTotal(draft.items, draft.discount).toFixed(2)}</p>
          </div>
        </div>
        {isEditable && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
        )}
      </div>
  );

  const ChatPanel = () => (
      <div className="flex flex-col h-full">
        <div className="flex-grow bg-background rounded-lg border shadow-inner overflow-hidden flex flex-col">
          <div className="flex-grow p-4 overflow-y-auto space-y-4 custom-scrollbar">
            {loadingChat && <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-seller-accent" /></div>}
            {chatError && <div className="text-destructive text-center p-4">{chatError}</div>}
            {chatMessages.map((msg, index) => {
              const isCurrentUser = msg.sender_id === sellerUser?.id;
              return (
                  <div key={msg.id || index} className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`px-4 py-2 rounded-lg max-w-[80%] ${isCurrentUser ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                      <p className="text-sm break-words">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
              );
            })}
            <div ref={chatMessagesEndRef} />
          </div>
          <div className="p-4 border-t bg-muted">
            <div className="flex items-center gap-2">
              <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  placeholder="Type your message..."
                  disabled={loadingChat}
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim() || loadingChat} className="bg-seller-accent hover:bg-seller-accent/90">
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
  );

  return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-card text-card-foreground rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col relative p-6" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground"><X /></button>
          <h2 className="text-2xl font-bold mb-4 border-b pb-3">
            {isEditable ? "Edit & Chat" : "View & Chat"} with {details?.buyer_name || 'Buyer'}
          </h2>
          {isLoading || !draft ? (
              <div className="flex-grow flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-seller-accent" /></div>
          ) : (
              <>
                {/* Mobile Tabbed View */}
                <div className="sm:hidden flex flex-col flex-grow overflow-hidden">
                  <div className="flex border-b">
                    <button onClick={() => setActiveTab('details')} className={cn('flex-1 py-2 text-center font-medium', activeTab === 'details' && 'border-b-2 border-primary text-primary')}>Details</button>
                    <button onClick={() => setActiveTab('chat')} className={cn('flex-1 py-2 text-center font-medium', activeTab === 'chat' && 'border-b-2 border-primary text-primary')}>Chat</button>
                  </div>
                  <div className="flex-grow pt-4 overflow-hidden">
                    {activeTab === 'details' ? <DetailsPanel /> : <ChatPanel />}
                  </div>
                </div>

                {/* Desktop Resizable View */}
                <div ref={containerRef} className="hidden sm:flex flex-grow overflow-hidden relative" style={{ cursor: isDragging ? 'col-resize' : 'default' }}>
                  <div style={{ width: `${panelWidth}%` }}><DetailsPanel /></div>
                  <div className="w-2 cursor-col-resize bg-border hover:bg-primary transition-colors" onMouseDown={handleMouseDown} />
                  <div style={{ width: `calc(${100 - panelWidth}% - 8px)` }} className="pl-2"><ChatPanel /></div>
                </div>
              </>
          )}
        </div>
      </div>
  );
};

// =====================================================================================
// Main MyQuotations Component
// =====================================================================================
const MyQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [activeQuotationId, setActiveQuotationId] = useState(null); // For the modal
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [sellerUser, setSellerUser] = useState(null);

  const { toast } = useToast();
  const ITEMS_PER_PAGE = 10;

  const getAuthToken = useCallback(() => localStorage.getItem('seller_token'), []);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('seller_user'));
      setSellerUser(user);
    } catch (e) { console.error("Failed to parse seller user from localStorage", e); }
  }, []);

  const fetchMyQuotations = useCallback(async (currentPage, reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage, limit: ITEMS_PER_PAGE, status: filterStatus || undefined, search: searchQuery || undefined };
      const response = await sellerAPI.getMyQuotations(params);

      if (response.success) {
        const newQuotations = Array.isArray(response.data) ? response.data : [];
        setQuotations(prev => reset ? newQuotations : [...prev, ...newQuotations.filter(nq => !prev.some(pq => pq.id === nq.id))]);
        setHasMore(newQuotations.length === ITEMS_PER_PAGE);
        if(reset) setPage(1);
      } else {
        setError(response.message || "Failed to fetch quotations.");
        toast({ title: "Error", description: response.message, variant: "destructive" });
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      toast({ title: "Error", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery, toast]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchMyQuotations(1, true);
    }, 500); // Debounce search/filter
    return () => clearTimeout(handler);
  }, [filterStatus, searchQuery, fetchMyQuotations]);

  useEffect(() => {
    if (!activeQuotationId) return;

    const token = getAuthToken();
    if (!token) { setChatError("Auth token not found."); return; }

    const activeQuotation = quotations.find(q => q.id === activeQuotationId);
    if (!activeQuotation?.order_id) { setChatError("Order ID not found for this quotation."); return; }

    socket.auth = { token };
    socket.connect();
    setLoadingChat(true);

    socket.emit('join_order_chat', { orderId: activeQuotation.order_id });

    const handleMessageHistory = (data) => {
      if (data.orderId === activeQuotation.order_id) {
        setChatMessages(data.messages || []);
        setLoadingChat(false);
      }
    };
    const handleNewMessage = (newMessage) => {
      if (newMessage.order_id === activeQuotation.order_id) {
        setChatMessages(prev => [...prev, newMessage]);
      }
    };

    socket.on('order_messages_history', handleMessageHistory);
    socket.on('new_order_message', handleNewMessage);

    return () => {
      socket.off('order_messages_history', handleMessageHistory);
      socket.off('new_order_message', handleNewMessage);
      socket.disconnect(); // Disconnect when modal closes to save resources
    };
  }, [activeQuotationId, getAuthToken, quotations]);

  const handleOpenChatModal = (quotationId) => setActiveQuotationId(quotationId);
  const handleCloseChatModal = () => {
    setActiveQuotationId(null);
    setChatMessages([]);
    setChatError(null);
  };

  const handleSendMessage = useCallback(() => {
    const activeQuotation = quotations.find(q => q.id === activeQuotationId);
    if (!newMessage.trim() || !activeQuotation?.order_id) return;
    socket.emit('send_order_message', { orderId: activeQuotation.order_id, message: newMessage.trim() });
    setNewMessage('');
  }, [newMessage, activeQuotationId, quotations]);

  const handleQuotationUpdate = () => {
    fetchMyQuotations(1, true); // Refresh the list from page 1
  };

  return (
      <div className="p-4 sm:p-6 space-y-6 bg-muted/40 min-h-screen">
        <h1 className="text-3xl font-bold text-seller-primary">My Quotations</h1>
        <Card>
          <CardHeader>
            <CardTitle>Manage Your Quotations</CardTitle>
            <CardDescription>Review, edit, and chat with buyers about your submitted quotations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input placeholder="Search Order ID or Buyer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select
                  value={filterStatus || 'all'}
                  onValueChange={(value) => setFilterStatus(value === 'all' ? '' : value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading && quotations.length === 0 ? (
                <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-seller-accent" /></div>
            ) : error ? (
                <div className="text-center py-8 text-destructive"><AlertCircle className="h-8 w-8 mx-auto mb-2" /><p>{error}</p></div>
            ) : quotations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-4" /><p>No quotations found.</p></div>
            ) : (
                <div className="space-y-4">
                  {quotations.map((quotation) => (
                      <Card key={quotation.id} className="p-4 transition-shadow hover:shadow-md">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                          <div className="flex-1 mb-4 sm:mb-0">
                            <h3 className="font-semibold text-lg text-primary">Order #{quotation.order_id}</h3>
                            <p className="text-sm text-muted-foreground">For: {quotation.buyer_name}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant={
                                quotation.status === 'accepted' ? 'default' :
                                    quotation.status === 'pending' ? 'secondary' :
                                        quotation.status === 'rejected' || quotation.status === 'cancelled' ? 'destructive' : 'outline'
                              }>
                                {quotation.status}
                              </Badge>
                              <span className="text-lg font-bold">₹{parseFloat(quotation.total_amount).toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(quotation.status === "pending" || quotation.status === "accepted") && (
                                <Button size="sm" onClick={() => handleOpenChatModal(quotation.id)}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  {quotation.status === 'pending' ? 'Edit & Chat' : 'View & Chat'}
                                </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                  ))}
                </div>
            )}

            {hasMore && !loading && (
                <div className="text-center mt-6">
                  <Button onClick={() => setPage(p => p + 1)} variant="outline">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Load More'}
                  </Button>
                </div>
            )}
          </CardContent>
        </Card>

        {activeQuotationId && (
            <ChatAndDetailsModal
                isOpen={!!activeQuotationId}
                onClose={handleCloseChatModal}
                quotationId={activeQuotationId}
                onQuotationUpdate={handleQuotationUpdate}
                chatMessages={chatMessages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleSendMessage={handleSendMessage}
                loadingChat={loadingChat}
                chatError={chatError}
                sellerUser={sellerUser}
            />
        )}
      </div>
  );
};

export default MyQuotations;
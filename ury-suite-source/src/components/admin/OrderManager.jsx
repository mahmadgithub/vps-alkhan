import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Search, Eye, Check, Printer, Filter, ShoppingBag, DollarSign,
  CheckCircle, Clock, Phone, Loader2, RefreshCw, Trash2, Tag, Utensils
} from 'lucide-react';
import Badge from '../common/Badge';
import Drawer from '../common/Drawer';

export default function OrderManager() {
  const { orders = [], getOrderDetails, updateOrderStatus, fetchLiveData, showToast } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  // Drawer & Detailed Order State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [fullOrderDoc, setFullOrderDoc] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch full detailed invoice when drawer opens
  useEffect(() => {
    let isMounted = true;
    if (selectedOrder?.invoice) {
      setLoadingDoc(true);
      getOrderDetails(selectedOrder.invoice).then(doc => {
        if (isMounted) {
          setFullOrderDoc(doc);
          setLoadingDoc(false);
        }
      });
    } else {
      setFullOrderDoc(null);
    }
    return () => { isMounted = false; };
  }, [selectedOrder]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (fetchLiveData) await fetchLiveData();
    setIsRefreshing(false);
    showToast('Refreshed orders from server database!');
  };

  const handleMarkPaid = async (invoiceName) => {
    await updateOrderStatus(invoiceName, 'Paid');
    if (selectedOrder && selectedOrder.invoice === invoiceName) {
      setSelectedOrder(prev => prev ? { ...prev, status: 'Paid', payment: 'Paid' } : null);
    }
  };

  const handleCancelOrder = async (invoiceName) => {
    await updateOrderStatus(invoiceName, 'Cancelled');
    if (selectedOrder && selectedOrder.invoice === invoiceName) {
      setSelectedOrder(null);
    }
  };

  const handlePrintReceipt = (invoiceName) => {
    window.print();
  };

  // Filtered orders list
  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o.invoice || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.phone || '').includes(searchQuery);
    const matchesChannel = selectedChannel === 'All' ||
                           (o.type || '').toLowerCase().includes(selectedChannel.toLowerCase());
    const matchesStatus = selectedStatus === 'All' ||
                          (selectedStatus === 'Paid' && (o.status === 'Paid' || o.payment === 'Paid')) ||
                          (selectedStatus === 'Draft' && (o.status === 'Draft' || o.status === 'Preparing')) ||
                          (selectedStatus === 'Consolidated' && o.status === 'Consolidated') ||
                          (selectedStatus === 'Cancelled' && o.status === 'Cancelled');
    return matchesSearch && matchesChannel && matchesStatus;
  });

  // Calculate Summary KPI Stats
  const totalRevenueSum = orders.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const paidOrdersCount = orders.filter(o => o.status === 'Paid' || o.payment === 'Paid').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'Draft' || o.status === 'Preparing').length;

  return (
    <div className="space-y-6 animate-fade-in printable-area">
      
      {/* Header & Refresh (Hidden in Print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm no-print">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-green-600" /> POS Order & Sales Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Live backend POS Invoices, kitchen KOT items & transaction history</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs border border-gray-200 transition"
          >
            <RefreshCw className={`h-4 w-4 text-green-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Orders'}
          </button>
        </div>
      </div>

      {/* KPI Summary Cards (Hidden in Print) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total POS Orders</span>
          <div className="text-2xl font-black text-gray-900">{orders.length}</div>
          <span className="text-[11px] text-green-600 font-bold">Live database count</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Sales Revenue</span>
          <div className="text-2xl font-black text-green-700">Rs {totalRevenueSum.toLocaleString()}</div>
          <span className="text-[11px] text-green-600 font-bold">Gross POS Invoices value</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Paid / Consolidated</span>
          <div className="text-2xl font-black text-emerald-600">{paidOrdersCount}</div>
          <span className="text-[11px] text-emerald-600 font-bold">Completed payments</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Draft / Preparing</span>
          <div className="text-2xl font-black text-amber-600">{pendingOrdersCount}</div>
          <span className="text-[11px] text-amber-600 font-bold">Active in kitchen</span>
        </div>
      </div>

      {/* Search & Channel Filter Bar (Hidden in Print) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          
          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl text-xs flex-1 max-w-sm">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoice #, customer name, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full text-xs font-semibold text-gray-800"
            />
          </div>

          {/* Service Channel Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700">
            <Utensils className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="All">All Service Channels</option>
              <option value="Dine-in">Dine-In</option>
              <option value="Take Away">Take Away</option>
              <option value="Delivery">Delivery</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid / Completed</option>
              <option value="Draft">Draft / Preparing</option>
              <option value="Consolidated">Consolidated</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Service Type</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(o => (
                  <tr key={o.invoice} className="hover:bg-gray-50 transition">
                    <td className="py-3.5 px-4 font-bold text-green-700">{o.invoice}</td>
                    <td className="py-3.5 px-4 text-gray-900 font-bold">
                      {o.customer}
                      <div className="text-[11px] text-gray-400 font-normal">{o.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-semibold">
                        {o.type}
                        {o.from_mobile && (
                          <span className="ml-1.5 text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-bold">📱 App</span>
                        )}
                      </td>
                    <td className="py-3.5 px-4 text-gray-500 font-medium">{o.time}</td>
                    <td className="py-3.5 px-4 font-extrabold text-green-700">Rs {(o.amount || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={o.status || 'Draft'} />
                    </td>

                    {/* ICON-ONLY Action Buttons */}
                    <td className="py-3.5 px-4 text-right no-print">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* View Details Button */}
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-green-600 hover:text-white text-gray-700 transition shadow-2xs"
                          title="View Full Order Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Print Receipt Button */}
                        <button
                          onClick={() => handlePrintReceipt(o.invoice)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition shadow-2xs"
                          title="Print Receipt / KOT"
                        >
                          <Printer className="h-4 w-4" />
                        </button>

                        {/* Mark Paid Button */}
                        {o.status !== 'Paid' && o.status !== 'Consolidated' && (
                          <button
                            onClick={() => handleMarkPaid(o.invoice)}
                            className="p-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-600 hover:text-white transition shadow-2xs"
                            title="Mark Order as Paid"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}

                        {/* Cancel Order Button */}
                        {o.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancelOrder(o.invoice)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition shadow-2xs"
                            title="Cancel Order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400 font-bold">
                    No orders found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Order Drawer */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order Specification — ${selectedOrder?.invoice}`}
      >
        {selectedOrder && (
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-500 font-medium">Customer Name:</span><span className="font-extrabold text-gray-900">{selectedOrder.customer}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-medium">Contact Phone:</span><span className="font-bold text-gray-700">{selectedOrder.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-medium">Order Type / Channel:</span><span className="font-bold text-green-700">{selectedOrder.type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-medium">Posting Time:</span><span className="font-bold text-gray-800">{selectedOrder.time}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500 font-medium">Status:</span><Badge status={selectedOrder.status} /></div>
            </div>

            {/* Line Items List from Frappe API */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                <span>Dishes & Items List</span>
                {loadingDoc && <Loader2 className="h-3.5 w-3.5 animate-spin text-green-600" />}
              </h4>

              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 text-xs">
                {fullOrderDoc?.items && fullOrderDoc.items.length > 0 ? (
                  fullOrderDoc.items.map((item, i) => (
                    <div key={i} className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-gray-900">{item.item_name}</div>
                        <div className="text-[11px] text-gray-400 font-medium">{item.qty} x Rs {(item.rate || item.price_list_rate || 0).toLocaleString()}</div>
                        {item.comment && (
                          <div className="text-[10.5px] text-amber-700 italic mt-0.5 font-bold">Note: {item.comment}</div>
                        )}
                      </div>
                      <div className="font-black text-green-700 text-sm">
                        Rs {(item.amount || (item.qty * item.rate)).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400 text-xs font-bold">
                    {loadingDoc ? 'Loading line items from backend...' : 'No detailed item records found.'}
                  </div>
                )}
              </div>
            </div>

            {/* Total Summary Box */}
            <div className="bg-green-50 p-4 rounded-xl border border-green-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-700 font-semibold">
                <span>Subtotal Items:</span>
                <span>Rs {(fullOrderDoc?.net_total || fullOrderDoc?.total || selectedOrder.amount).toLocaleString()}</span>
              </div>
              {/* Tax: always 8% */}
              <div className="flex justify-between text-blue-700 font-semibold">
                <span>Tax (8%):</span>
                <span>+Rs {(
                  fullOrderDoc
                    ? Math.round((fullOrderDoc.net_total || fullOrderDoc.total || 0) * 0.08)
                    : Math.round((selectedOrder.net_total || selectedOrder.amount || 0) * 0.08)
                ).toLocaleString()}</span>
              </div>
              <div className="border-t border-green-200 pt-2 flex justify-between font-black text-green-900 text-base">
                <span>Grand Total</span>
                <span>Rs {(fullOrderDoc?.grand_total || selectedOrder.amount).toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              {selectedOrder.status !== 'Paid' && selectedOrder.status !== 'Consolidated' && (
                <button
                  onClick={() => handleMarkPaid(selectedOrder.invoice)}
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" /> Mark Order as Paid
                </button>
              )}

              <button
                onClick={() => handlePrintReceipt(selectedOrder.invoice)}
                className="w-full py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 font-bold text-xs flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4" /> Print KOT / Customer Receipt
              </button>
            </div>

          </div>
        )}
      </Drawer>

    </div>
  );
}

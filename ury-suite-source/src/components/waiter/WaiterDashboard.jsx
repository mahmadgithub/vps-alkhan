import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { fetchTableItemsFromBackend } from '../../api/client';
import {
  Users,
  Clock,
  Plus,
  Minus,
  Trash2,
  Send,
  CheckCircle,
  Utensils,
  Search,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  RefreshCw,
  ArrowRightLeft,
  MessageSquare
} from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export default function WaiterDashboard() {
  const {
    tables = [],
    categories = [],
    menuItems = [],
    kots = [],
    orders = [],
    createTableOrder,
    transferTableOrder,
    fetchLiveData,
    showToast
  } = useRestaurant();

  const [selectedRoom, setSelectedRoom] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTable, setActiveTable] = useState(null);
  const [tableGuestCount, setTableGuestCount] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [existingOrderItems, setExistingOrderItems] = useState([]);
  const [waiterOrderCart, setWaiterOrderCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Transfer Table Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromTable, setTransferFromTable] = useState('');
  const [transferToTable, setTransferToTable] = useState('');

  const rooms = ['All', 'Main Hall', 'Terrace', 'VIP Lounge', 'Rooftop', 'Family Hall'];

  const safeTables = Array.isArray(tables) ? tables : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];

  const cleanTableStr = (str) => {
    if (!str) return '';
    let s = String(str).trim().toLowerCase();
    if (s.includes(' - ')) s = s.split(' - ')[0].trim();
    s = s.replace(/table/gi, '')
         .replace(/tbl/gi, '')
         .replace(/glb/gi, '')
         .replace(/[^a-z0-9]/gi, '')
         .replace(/^t/i, '')
         .replace(/^0+/, '');
    return s.trim();
  };

  const isSameTable = (a, b) => {
    if (!a || !b) return false;
    const cleanA = cleanTableStr(a);
    const cleanB = cleanTableStr(b);
    if (!cleanA || !cleanB) return false;
    return cleanA === cleanB;
  };

  const getTableActiveItemCount = (tableName) => {
    if (!tableName) return 0;
    const matchingTable = safeTables.find(t => isSameTable(t.name, tableName) || isSameTable(t.full_name, tableName));
    if (!matchingTable || matchingTable.status === 'Free' || matchingTable.occupied == 0) return 0;

    let count = 0;
    if (matchingTable.items && Array.isArray(matchingTable.items) && matchingTable.items.length > 0) {
      matchingTable.items.forEach(i => count += Number(i.qty || 1));
      return count;
    }

    const safeKots = Array.isArray(kots) ? kots : [];
    const isKotActive = (k) => {
      if (!k) return false;
      const s = (k.status || k.order_status || '').toString().toLowerCase();
      return !['completed', 'paid', 'cancelled', 'canceled', 'finished', 'delivered', 'closed'].includes(s);
    };

    const matchingKots = safeKots.filter(k => isKotActive(k) && (isSameTable(k.table, tableName) || isSameTable(k.restaurant_table, tableName)));
    matchingKots.forEach(k => {
      (k.items || []).forEach(i => count += Number(i.qty || 1));
    });

    return count;
  };

  const filteredTables = safeTables.filter(t => {
    if (!t) return false;
    const tRoom = typeof t.room === 'object' ? (t.room.name || String(t.room)) : (t.room || 'Main Hall');
    const matchesRoom = selectedRoom === 'All' || tRoom === selectedRoom;
    const tStatus = typeof t.status === 'object' ? (t.status.status || 'Free') : (t.status || 'Free');
    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Free' && (tStatus === 'Free' || tStatus === 'Available')) ||
      (statusFilter === 'Reserved' && (tStatus === 'Reserved' || tStatus === 'Reserve' || tStatus === 'Busy' || tStatus === 'Occupied'));
    return matchesRoom && matchesStatus;
  });

  const filteredMenu = safeMenuItems.filter(item => {
    if (!item) return false;
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory || (item.course_label && item.course_label.toLowerCase() === selectedCategory);
    const matchesSearch = (item.item_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleRefreshTables = async () => {
    setIsRefreshing(true);
    try {
      if (fetchLiveData) await fetchLiveData();
      showToast('Live floor tables refreshed from server!', 'info');
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenTableOrder = async (table) => {
    setActiveTable(table);
    setWaiterOrderCart([]);
    setOrderNotes('');

    if (!table) {
      setExistingOrderItems([]);
      return;
    }

    const tableName = table.name || table.full_name;
    const tStatus = typeof table.status === 'object' ? (table.status.status || 'Free') : (table.status || 'Free');
    const isFree = (tStatus === 'Free' || tStatus === 'Available') && table.occupied == 0 && (!table.items || table.items.length === 0);

    if (isFree && (!table.items || table.items.length === 0)) {
      setExistingOrderItems([]);
      return;
    }

    // 1. Priority: Active session items on table object
    if (Array.isArray(table.items) && table.items.length > 0) {
      setExistingOrderItems(table.items);
      return;
    }

    // 2. Direct Live API Fetch from Frappe Backend Database for latest active invoice
    try {
      const backendItems = await fetchTableItemsFromBackend(tableName, safeMenuItems);
      if (backendItems && backendItems.length > 0) {
        setExistingOrderItems(backendItems);
      } else {
        setExistingOrderItems([]);
      }
    } catch (e) {
      console.warn('WaiterDashboard live backend table items fetch error:', e);
      setExistingOrderItems([]);
    }
  };

  const handleAddToCart = (item) => {
    setWaiterOrderCart(prev => {
      const idx = prev.findIndex(i => i.item_code === item.item_code);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].qty += 1;
        return updated;
      }
      return [...prev, { ...item, qty: 1, notes: '' }];
    });
  };

  const handleUpdateCartQty = (itemCode, delta) => {
    setWaiterOrderCart(prev => prev.map(i => {
      if (i.item_code === itemCode) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : null;
      }
      return i;
    }).filter(Boolean));
  };

  const handleRemoveFromCart = (itemCode) => {
    setWaiterOrderCart(prev => prev.filter(i => i.item_code !== itemCode));
  };

  const handleSendToKitchen = async () => {
    if (!activeTable || waiterOrderCart.length === 0) return;
    setIsSubmitting(true);
    try {
      if (createTableOrder) {
        await createTableOrder(activeTable.name, waiterOrderCart, tableGuestCount, orderNotes);
      }
      setActiveTable(null);
      setWaiterOrderCart([]);
      setOrderNotes('');
    } catch (e) {
      console.warn('Send order error:', e);
      showToast('Error placing table order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItemToTableCart = handleAddToCart;
  const handleUpdateQty = handleUpdateCartQty;

  const handleUpdateItemNotes = (itemCode, notesText) => {
    setWaiterOrderCart(prev => prev.map(item => item.item_code === itemCode ? { ...item, notes: notesText } : item));
  };

  const handleSendTableToKitchen = handleSendToKitchen;

  const handleTransferSubmit = async () => {
    if (!transferFromTable || !transferToTable || transferFromTable === transferToTable) {
      showToast('Please select two different tables!', 'warning');
      return;
    }
    try {
      if (transferTableOrder) {
        await transferTableOrder(transferFromTable, transferToTable);
      }
      setIsTransferModalOpen(false);
    } catch (e) {
      console.warn('Transfer error:', e);
    }
  };

  const handleConfirmTableTransfer = handleTransferSubmit;

  const existingTotal = existingOrderItems.reduce((sum, i) => sum + ((i.price || 0) * i.qty), 0);
  const newCartTotal = waiterOrderCart.reduce((sum, i) => sum + ((i.price || 0) * i.qty), 0);
  const grandTotal = existingTotal + newCartTotal;
  const busyTables = safeTables.filter(t => t.status !== 'Free');
  const defaultFoodImage = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80';

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Utensils className="h-6 w-6 text-green-600" /> Waiter Ordering & Floor Map
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Select a table to open guest order pad or transfer active dining tables</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={handleRefreshTables}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Transfer Button */}
          <button
            onClick={() => {
              if (busyTables.length > 0) setTransferFromTable(busyTables[0].name);
              setIsTransferModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-sky-700 hover:bg-gray-100 transition shadow-2xs"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" /> Transfer Order
          </button>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none border-r border-gray-200 pr-2">
            {['All', 'Free', 'Reserved'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? (st === 'Reserved' ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Room Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {rooms.map(room => (
              <button
                key={room}
                onClick={() => setSelectedRoom(room)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedRoom === room
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {room}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {filteredTables.map(t => {
          const activeCount = getTableActiveItemCount(t.name);
          return (
            <div
              key={t.name || t.full_name}
              onClick={() => handleOpenTableOrder(t)}
              className="cursor-pointer bg-white p-4 rounded-2xl border border-gray-200 shadow-sm transition duration-200 hover:border-green-500 hover:shadow-md flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-gray-900 group-hover:text-green-700 transition">{t.name}</span>
                <Badge status={t.status} />
              </div>

              <div className="space-y-1 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  <span>Seats: {t.capacity}</span>
                </div>
                {t.status !== 'Free' && (
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Time: {t.elapsed || '10m'}</span>
                  </div>
                )}
                {t.status !== 'Free' && activeCount > 0 && (
                  <div className="w-full bg-amber-500 text-white font-black text-[10px] tracking-wide text-center py-1 rounded-lg uppercase shadow-2xs mt-1">
                    {activeCount} ACTIVE ITEMS
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-600">
                <span>{t.room || 'Main Hall'}</span>
                <ChevronRight className="h-4 w-4 text-green-600 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Waiter Create Order Modal */}
      <Modal
        isOpen={!!activeTable}
        onClose={() => setActiveTable(null)}
        title={`Table ${activeTable?.name} — ${existingOrderItems.length > 0 ? 'Active Table Order & Menu' : 'Create Order'}`}
        maxWidth="max-w-4xl"
      >
        {activeTable && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Left Column: Category & Item Picker */}
            <div className="lg:col-span-2 space-y-3.5">
              
              {/* Guests Selector & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">Party Size:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 4, 6, 8].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setTableGuestCount(cnt)}
                        className={`w-7 h-7 rounded-lg text-xs font-black transition ${
                          tableGuestCount === cnt ? 'bg-green-600 text-white shadow-2xs' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative w-full sm:w-44">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 pl-8 pr-2 py-1.5 rounded-lg text-xs outline-none focus:border-green-600 font-medium"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {safeCategories.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      selectedCategory === c.id
                        ? 'bg-green-600 text-white shadow-2xs'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Menu items grid */}
              <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredMenu.map(item => {
                  const inCartItem = waiterOrderCart.find(i => i.item_code === item.item_code);
                  const qtyInCart = inCartItem ? inCartItem.qty : 0;

                  return (
                    <div
                      key={item.item_code}
                      onClick={() => handleAddItemToTableCart(item)}
                      style={{
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: qtyInCart > 0 ? '#16a34a' : '#e5e7eb',
                        backgroundColor: qtyInCart > 0 ? '#f0fdf4' : '#ffffff',
                        boxSizing: 'border-box'
                      }}
                      className="cursor-pointer p-2.5 rounded-xl transition-all duration-150 flex items-center justify-between gap-2.5 shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img
                          src={item.image || defaultFoodImage}
                          alt={item.item_name}
                          style={{ width: '42px', height: '42px' }}
                          className="rounded-lg object-cover border border-gray-100 bg-gray-50 shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultFoodImage;
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.item_name}</h4>
                          <p className="text-xs font-black text-green-700 mt-0.5 block">Rs {item.price.toLocaleString()}</p>
                        </div>
                      </div>

                      <div style={{ width: '28px', height: '28px' }} className="shrink-0 flex items-center justify-center">
                        {qtyInCart > 0 ? (
                          <div style={{ width: '28px', height: '28px', backgroundColor: '#16a34a', color: '#ffffff' }} className="rounded-full font-black text-xs flex items-center justify-center shadow-2xs select-none">
                            {qtyInCart}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddItemToTableCart(item);
                            }}
                            style={{ width: '28px', height: '28px' }}
                            className="rounded-full bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 flex items-center justify-center transition"
                            title="Add item"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Order Summary Cart */}
            <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-green-600" />
                    Table Order Pad
                  </h3>
                  <span className="text-[11px] font-bold text-green-700">Table: {activeTable.name}</span>
                </div>

                {/* SECTION 1: Currently Active Table Order (If any) */}
                {existingOrderItems.length > 0 && (
                  <div className="space-y-2 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-amber-600" /> Currently Given Order ({existingOrderItems.reduce((a, b) => a + b.qty, 0)} Items)
                      </span>
                      <span className="text-[9.5px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">ACTIVE</span>
                    </div>

                    <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1 divide-y divide-amber-200/50">
                      {existingOrderItems.map(i => (
                        <div key={i.item_code} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-900 line-clamp-1">{i.item_name}</div>
                            <div className="text-[10px] text-amber-800 font-semibold">Rs {i.price.toLocaleString()} × {i.qty}</div>
                          </div>
                          <div className="text-right shrink-0 font-black text-gray-900 text-xs">
                            Rs {(i.price * i.qty).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-amber-200/80 pt-1.5 flex justify-between items-center text-[11px] font-bold text-amber-900">
                      <span>Active Order Total:</span>
                      <span className="font-extrabold">Rs {existingTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* SECTION 2: New Add-on / Running Items */}
                <div className="space-y-2">
                  <h4 className="text-[10.5px] font-black text-gray-700 uppercase tracking-wider flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5 text-green-600" />
                    {existingOrderItems.length > 0 ? 'Add Running / Add-on Items' : 'Select Order Items'}
                  </h4>

                  {waiterOrderCart.length === 0 ? (
                    <div className="text-center py-5 text-xs text-gray-400 font-medium bg-white rounded-xl border border-dashed border-gray-200 p-3">
                      {existingOrderItems.length > 0
                        ? 'Click menu items on left to add items to running order.'
                        : 'No items selected. Click menu items to add to table order.'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 divide-y divide-gray-200/60 bg-white p-2 rounded-xl border border-gray-200">
                      {waiterOrderCart.map(i => (
                        <div key={i.item_code} className="pt-2 first:pt-0 space-y-1">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-gray-900 line-clamp-1">{i.item_name}</div>
                              <div className="text-[11px] text-gray-500 font-medium">Rs {i.price.toLocaleString()} × {i.qty}</div>
                            </div>

                            <div className="flex items-center bg-gray-50 p-0.5 rounded-lg border border-gray-200 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(i.item_code, -1)}
                                className="w-5 h-5 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-red-600 transition"
                              >
                                {i.qty === 1 ? <Trash2 className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3" />}
                              </button>
                              
                              <span className="w-5 text-center font-extrabold text-gray-900 text-xs select-none">
                                {i.qty}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleUpdateQty(i.item_code, 1)}
                                className="w-5 h-5 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-green-600 transition"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            placeholder="Item instructions (e.g. Extra spicy)..."
                            value={i.notes || ''}
                            onChange={(e) => handleUpdateItemNotes(i.item_code, e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 px-2 py-1 rounded text-[10px] text-gray-700 outline-none focus:border-green-600 font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Special Instructions */}
                  <div className="pt-1">
                    <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mb-1">
                      <MessageSquare className="h-3 w-3 text-gray-400" /> Kitchen Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Serve starters first..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full bg-white border border-gray-200 p-2 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:border-green-600"
                    />
                  </div>
                </div>
              </div>

              {/* Totals & Submit Button */}
              <div className="border-t border-gray-200 pt-3 space-y-3">
                <div className="space-y-1 text-xs">
                  {existingOrderItems.length > 0 && (
                    <div className="flex justify-between text-gray-500 font-medium">
                      <span>Active Order:</span>
                      <span>Rs {existingTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {waiterOrderCart.length > 0 && (
                    <div className="flex justify-between text-gray-500 font-medium">
                      <span>New Additions:</span>
                      <span>Rs {newCartTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-gray-900 pt-1 border-t border-gray-100">
                    <span className="text-xs">Total Table Bill:</span>
                    <span className="text-green-700 text-base font-black">Rs {grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendTableToKitchen}
                  disabled={waiterOrderCart.length === 0 || isSubmitting}
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {isSubmitting ? 'Sending Order to Kitchen API...' : (
                    <>
                      <Send className="h-4 w-4" /> {existingOrderItems.length > 0 ? 'Send Add-on / Running Order' : 'Send to Kitchen KOT'}
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* Transfer Table Modal */}
      {isTransferModalOpen && (
        <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Table Order">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">From Table (Occupied Table)</label>
              <select
                value={transferFromTable}
                onChange={(e) => setTransferFromTable(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 cursor-pointer"
              >
                {safeTables.map(t => (
                  <option key={t.name} value={t.name}>{t.name} ({t.status})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">To Table (Target Free Table)</label>
              <select
                value={transferToTable}
                onChange={(e) => setTransferToTable(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 cursor-pointer"
              >
                <option value="">Select target table...</option>
                {safeTables.filter(t => t.name !== transferFromTable).map(t => (
                  <option key={t.name} value={t.name}>{t.name} ({t.status})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTableTransfer}
                disabled={!transferFromTable || !transferToTable || transferFromTable === transferToTable}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition"
              >
                Transfer Order
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

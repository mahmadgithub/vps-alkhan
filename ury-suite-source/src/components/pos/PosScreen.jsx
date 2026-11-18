import React, { useState } from 'react';
import { useRestaurant, saveTableItemsToStorage } from '../../context/RestaurantContext';
import { fetchTableItemsFromBackend, callUryApi } from '../../api/client';
import {
  CreditCard,
  Plus,
  Minus,
  Trash2,
  User,
  Percent,
  Scissors,
  GitMerge,
  Printer,
  CheckCircle,
  Grid,
  Search,
  DollarSign,
  Utensils,
  ShoppingBag,
  Truck,
  Clock,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';

export default function PosScreen() {
  const {
    tables = [],
    categories = [],
    menuItems = [],
    customers = [],
    kots = [],
    orders = [],
    setTables,
    setKots,
    setOrders,
    completePosPayment,
    showToast
  } = useRestaurant();

  // POS Service Type State: 'Dine In' | 'Takeaway' | 'Delivery'
  const [serviceType, setServiceType] = useState('Dine In');

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [posCart, setPosCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [selectedTable, setSelectedTable] = useState('T01');
  const [discountMode, setDiscountMode] = useState('percent'); // 'percent' | 'amount'
  const [disPercentInput, setDisPercentInput] = useState('');
  const [disAmountInput, setDisAmountInput] = useState('');

  // Modals state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [ordersFilterTab, setOrdersFilterTab] = useState('all'); // 'all' | 'delivery' | 'takeaway' | 'dinein' | 'unpaid' | 'paid'
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastInvoiceReceipt, setLastInvoiceReceipt] = useState(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountTendered, setAmountTendered] = useState(3000);

  // Split bill state
  const [splitMode, setSplitMode] = useState('items'); // 'items' | 'equal'
  const [splitParts, setSplitParts] = useState(2);
  const [splitSelectedMap, setSplitSelectedMap] = useState({});
  const [activeSplitCart, setActiveSplitCart] = useState(null);

  // Merge bill state
  const [primaryTable, setPrimaryTable] = useState('T01');
  const [secondaryTable, setSecondaryTable] = useState('T02');

  const safeTables = Array.isArray(tables) ? tables : [];
  const safeKots = Array.isArray(kots) ? kots : [];
  const safeOrders = Array.isArray(orders) ? orders : [];

  const filteredOrdersList = safeOrders.filter(o => {
    if (!o) return false;
    const rawType = (o.order_type || o.type || '').toLowerCase();
    const isPaid = o.status === 'Paid' || (o.paid >= o.amount && o.amount > 0);

    if (ordersFilterTab === 'delivery' && !rawType.includes('delivery')) return false;
    if (ordersFilterTab === 'takeaway' && !rawType.includes('take') && !rawType.includes('pickup')) return false;
    if (ordersFilterTab === 'dinein' && (rawType.includes('delivery') || rawType.includes('take') || rawType.includes('pickup'))) return false;
    if (ordersFilterTab === 'unpaid' && isPaid) return false;
    if (ordersFilterTab === 'paid' && !isPaid) return false;

    if (ordersSearchQuery) {
      const q = ordersSearchQuery.toLowerCase();
      const matchInv = (o.invoice || '').toLowerCase().includes(q);
      const matchCust = (o.customer || '').toLowerCase().includes(q);
      const matchTable = (o.restaurant_table || '').toLowerCase().includes(q);
      const matchItem = Array.isArray(o.items) && o.items.some(i => (i.item_name || i.item_code || '').toLowerCase().includes(q));
      return matchInv || matchCust || matchTable || matchItem;
    }

    return true;
  });

  const handleLoadOrderToCart = async (order) => {
    if (!order) return;
    if (order.customer) setCustomerName(order.customer);

    const rawType = (order.order_type || order.type || '').toLowerCase();
    if (rawType.includes('delivery')) {
      setServiceType('Delivery');
    } else if (rawType.includes('take') || rawType.includes('pickup')) {
      setServiceType('Takeaway');
    } else {
      setServiceType('Dine In');
      if (order.restaurant_table) setSelectedTable(order.restaurant_table);
    }

    let itemsToLoad = Array.isArray(order.items) ? order.items : [];

    // Fallback: If order.items is empty, fetch items live from Frappe backend
    if (itemsToLoad.length === 0 && (order.invoice || order.name)) {
      try {
        const targetInv = order.invoice || order.name;
        const res = await callUryApi('frappe.client.get_list', {
          doctype: 'POS Invoice Item',
          filters: { parent: targetInv },
          fields: ['item_code', 'item_name', 'qty', 'rate', 'amount']
        }, { silent: true });

        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          itemsToLoad = res.data.map(i => ({
            item_code: i.item_code || i.item_name,
            item_name: i.item_name || i.item_code,
            price: i.rate || i.amount || 0,
            qty: i.qty || 1
          }));
        }
      } catch (e) {
        console.warn('Error fetching order items for cart:', e);
      }
    }

    if (itemsToLoad.length > 0) {
      const formattedItems = itemsToLoad.map(i => ({
        item_code: i.item_code || i.item_name,
        item_name: i.item_name || i.item_code,
        price: i.price || i.rate || 0,
        qty: i.qty || 1
      }));
      setPosCart(formattedItems);
      showToast(`Loaded ${formattedItems.length} item(s) from Order ${order.invoice || order.name} into POS Cart!`, 'success');
    } else {
      showToast(`Order ${order.invoice || order.name} loaded.`, 'info');
    }
    setIsOrdersModalOpen(false);
  };

  const handleViewOrderReceipt = (order) => {
    const formattedItems = (order.items || []).map(i => ({
      item_name: i.item_name || i.item_code,
      price: i.price || i.rate || 0,
      qty: i.qty || 1
    }));

    const rawOrderType = (order.type || order.order_type || '').toLowerCase();
    const isDel = rawOrderType.includes('delivery');
    const orderDeliveryFee = isDel ? 100 : 0;

    const sub = order.net_total || order.amount || 0;
    const tax = order.tax_amount || Math.round(sub * taxRate);
    const grand = order.amount || (sub + tax + orderDeliveryFee);

    const receiptData = {
      invoice: order.invoice || order.name,
      customer: order.customer || 'Guest',
      table: order.restaurant_table ? `Table ${order.restaurant_table}` : (order.type || order.order_type || 'Takeaway'),
      items: formattedItems,
      subtotal: sub,
      discountPercent: 0,
      discountAmount: 0,
      taxAmount: tax,
      deliveryFee: orderDeliveryFee,
      taxPercentDisplay: taxPercentDisplay,
      grandTotal: grand,
      amountTendered: order.paid || grand,
      changeDue: Math.max(0, (order.paid || grand) - grand),
      paymentMethod: order.paid >= grand ? 'CASH / CARD' : 'UNPAID',
      date: order.date || new Date().toLocaleDateString(),
      time: order.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setLastInvoiceReceipt(receiptData);
    setIsOrdersModalOpen(false);
    setIsReceiptModalOpen(true);
  };

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

  // Helper to load items for a specific table
  const handleSelectTable = async (tableName) => {
    setSelectedTable(tableName);
    if (!tableName) {
      setPosCart([]);
      return;
    }

    const matchingTable = safeTables.find(t => isSameTable(t.name, tableName) || isSameTable(t.full_name, tableName));
    const isFree = !matchingTable || matchingTable.status === 'Free' || matchingTable.occupied == 0 || matchingTable.occupied === false;

    if (isFree && (!matchingTable?.items || matchingTable.items.length === 0)) {
      setPosCart([]);
      return;
    }

    const formattedLabel = String(tableName).toLowerCase().startsWith('table')
      ? tableName
      : `Table ${tableName}`;

    // 1. Priority: Active session items on table object
    if (matchingTable && Array.isArray(matchingTable.items) && matchingTable.items.length > 0) {
      setPosCart(matchingTable.items);
      showToast(`Loaded ${matchingTable.items.length} active item(s) for ${formattedLabel}!`, 'success');
      return;
    }

    // 2. Query Frappe Backend Server for latest active invoice items
    try {
      const backendItems = await fetchTableItemsFromBackend(tableName, menuItems);
      if (backendItems && backendItems.length > 0) {
        setPosCart(backendItems);
        showToast(`Loaded ${backendItems.length} active item(s) from live backend database for ${formattedLabel}!`, 'success');
      } else {
        setPosCart([]);
      }
    } catch (e) {
      console.warn('POS live backend table items fetch error:', e);
      setPosCart([]);
    }
  };

  // Helper to count active items on a table card
  const getTableActiveItemCount = (tableName) => {
    if (!tableName) return 0;

    const matchingTable = safeTables.find(t => isSameTable(t.name, tableName) || isSameTable(t.full_name, tableName));
    const isTableFree = matchingTable && matchingTable.status === 'Free' && matchingTable.occupied == 0;
    if (isTableFree) return 0;

    const isKotActive = (k) => {
      if (!k) return false;
      const s = (k.status || k.order_status || '').toString().toUpperCase();
      return !['SERVED', 'COMPLETED', 'PAID', 'CANCELLED', 'CANCELED', 'FINISHED', 'DELIVERED', 'CLOSED'].includes(s);
    };

    const matchingKots = safeKots.filter(k => {
      if (!isKotActive(k)) return false;
      return isSameTable(k.table, tableName) || isSameTable(k.restaurant_table, tableName);
    });

    const kotItemsCount = matchingKots.reduce((sum, k) => sum + (Array.isArray(k.items) ? k.items.reduce((s, i) => s + (i.qty || 1), 0) : 0), 0);
    if (kotItemsCount > 0) return kotItemsCount;

    const matchingOrders = safeOrders.filter(o => {
      if (!o) return false;
      const payLower = (o.payment || o.status || '').toString().toLowerCase();
      if (payLower === 'paid' || payLower === 'completed') return false;
      return isSameTable(o.restaurant_table, tableName) || isSameTable(o.type, tableName) || isSameTable(o.customer, tableName);
    });
    const orderItemsCount = matchingOrders.reduce((sum, o) => sum + (Array.isArray(o.items) ? o.items.reduce((s, i) => s + (i.qty || 1), 0) : 0), 0);
    if (orderItemsCount > 0) return orderItemsCount;

    if (matchingTable && Array.isArray(matchingTable.items)) {
      return matchingTable.items.reduce((s, i) => s + (i.qty || 1), 0);
    }

    return 0;
  };

  const handleServiceTypeChange = (type) => {
    setServiceType(type);
    if (type === 'Dine In') {
      const validTable = (selectedTable && selectedTable !== 'Takeaway' && selectedTable !== 'Delivery')
        ? selectedTable
        : (safeTables[0] ? safeTables[0].name : 'T01');
      setSelectedTable(validTable);
      handleSelectTable(validTable);
    } else {
      setPosCart([]);
      showToast(`POS switched to ${type} mode`, 'info');
    }
  };

  const currentDisplayTable = (selectedTable && selectedTable !== 'Takeaway' && selectedTable !== 'Delivery')
    ? selectedTable
    : 'Table';

  const filteredMenu = menuItems.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory || (item.course_label && item.course_label.toLowerCase() === selectedCategory);
    const matchesSearch = (item.item_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Tax rate: 8% flat
  const taxRate = 0.08;
  const taxPercentDisplay = '8%';

  // Delivery charge: 100 Rs flat for delivery orders
  const deliveryFee = serviceType === 'Delivery' ? 100 : 0;

  const subtotal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  let discountAmount = 0;
  let discountPercent = 0;
  const parsedPct = parseFloat(disPercentInput) || 0;
  const parsedRs = parseFloat(disAmountInput) || 0;

  if (parsedPct > 0) {
    // Percentage discount on specified amount or subtotal
    const baseAmount = parsedRs > 0 ? parsedRs : subtotal;
    discountPercent = parsedPct;
    discountAmount = Math.round((baseAmount * parsedPct) / 100);
  } else if (parsedRs > 0) {
    // Flat Rupee discount
    discountAmount = parsedRs;
    discountPercent = subtotal > 0 ? Number(((parsedRs / subtotal) * 100).toFixed(2)) : 0;
  }

  const taxAmount = Math.round(Math.max(0, subtotal - discountAmount) * taxRate);
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount + deliveryFee);

  // Active payment calculations (Handles Split Portion vs Full Cart)
  const activeItemsToPay = activeSplitCart ? activeSplitCart.items : posCart;
  const activeSubtotalToPay = activeSplitCart ? activeSplitCart.subtotal : subtotal;
  const activeDiscountAmount = activeSplitCart ? 0 : discountAmount;
  const activeTaxAmount = Math.round((activeSubtotalToPay - activeDiscountAmount) * taxRate);
  const activeDeliveryFee = activeSplitCart ? 0 : deliveryFee;
  const activeGrandTotalToPay = activeSubtotalToPay - activeDiscountAmount + activeTaxAmount + activeDeliveryFee;

  const numericTendered = Number(amountTendered) || 0;
  const changeDue = Math.max(0, numericTendered - activeGrandTotalToPay);

  const handleAddItemToPosCart = (item) => {
    setPosCart(prev => {
      const idx = prev.findIndex(i => i.item_code === item.item_code);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].qty += 1;
        return updated;
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const handleUpdateQty = (item_code, delta) => {
    setPosCart(prev => prev.map(item => {
      if (item.item_code === item_code) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenSplitModal = () => {
    if (!posCart || posCart.length === 0) {
      showToast('Please select a table with active items or add items to cart first to split bill!', 'warning');
      return;
    }
    const initMap = {};
    posCart.forEach(i => {
      initMap[i.item_code] = 0;
    });
    setSplitSelectedMap(initMap);
    setSplitMode('items');
    setSplitParts(2);
    setIsSplitModalOpen(true);
  };

  const handleToggleSplitItem = (itemCode, fullQty) => {
    setSplitSelectedMap(prev => {
      const current = prev[itemCode] || 0;
      const next = current > 0 ? 0 : fullQty;
      return { ...prev, [itemCode]: next };
    });
  };

  const handleUpdateSplitQty = (itemCode, delta, maxQty) => {
    setSplitSelectedMap(prev => {
      const current = prev[itemCode] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      return { ...prev, [itemCode]: next };
    });
  };

  const calculateSplitTotals = () => {
    let splitSubtotal = 0;
    let remainingSubtotal = 0;
    const splitItems = [];
    const remainingItems = [];

    (posCart || []).forEach(item => {
      const sQty = splitSelectedMap[item.item_code] || 0;
      const rQty = item.qty - sQty;

      if (sQty > 0) {
        splitSubtotal += (item.price || 0) * sQty;
        splitItems.push({ ...item, qty: sQty });
      }
      if (rQty > 0) {
        remainingSubtotal += (item.price || 0) * rQty;
        remainingItems.push({ ...item, qty: rQty });
      }
    });

    return { splitSubtotal, remainingSubtotal, splitItems, remainingItems };
  };

  const handleProceedSplitPayment = () => {
    const { splitSubtotal, splitItems, remainingItems } = calculateSplitTotals();
    if (splitItems.length === 0 || splitSubtotal === 0) {
      showToast('Please select at least 1 item or quantity to split!', 'warning');
      return;
    }

    const splitTax = Math.round(splitSubtotal * taxRate);
    const splitGrandTotal = splitSubtotal + splitTax;

    setActiveSplitCart({
      items: splitItems,
      subtotal: splitSubtotal,
      remainingItems: remainingItems
    });
    setAmountTendered(splitGrandTotal);

    setIsSplitModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handleCompletePosPayment = async () => {
    const currentItemsToPay = activeSplitCart ? activeSplitCart.items : posCart;
    const currentSubtotalToPay = activeSplitCart ? activeSplitCart.subtotal : subtotal;

    if (isSubmitting || currentItemsToPay.length === 0) return;
    setIsSubmitting(true);
    try {
      const splitDiscount = activeSplitCart ? 0 : discountAmount;
      const splitTax = Math.round(currentSubtotalToPay * taxRate);
      const currentDeliveryFee = activeSplitCart ? 0 : deliveryFee;
      const splitGrandTotal = currentSubtotalToPay - splitDiscount + splitTax + currentDeliveryFee;

      const createdInvoiceNo = await completePosPayment({
        customer: customerName || 'Ahmad Raza',
        table: serviceType === 'Dine In' ? selectedTable : serviceType,
        items: currentItemsToPay,
        discountPercent: activeSplitCart ? 0 : discountPercent,
        discountAmount: splitDiscount,
        taxAmount: splitTax,
        deliveryFee: currentDeliveryFee,
        grandTotal: splitGrandTotal,
        amountTendered: amountTendered,
        paymentMethod: paymentMethod
      });

      const receiptData = {
        invoice: createdInvoiceNo || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        customer: customerName || 'Ahmad Raza',
        table: serviceType === 'Dine In' ? selectedTable : serviceType,
        items: [...currentItemsToPay],
        subtotal: currentSubtotalToPay,
        discountPercent: activeSplitCart ? 0 : discountPercent,
        discountAmount: splitDiscount,
        taxAmount: splitTax,
        deliveryFee: currentDeliveryFee,
        taxPercentDisplay: taxPercentDisplay,
        grandTotal: splitGrandTotal,
        amountTendered: amountTendered,
        changeDue: Math.max(0, amountTendered - splitGrandTotal),
        paymentMethod: paymentMethod,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setLastInvoiceReceipt(receiptData);
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);

      if (activeSplitCart && Array.isArray(activeSplitCart.remainingItems)) {
        const remaining = activeSplitCart.remainingItems;
        setPosCart(remaining);
        if (selectedTable && serviceType === 'Dine In') {
          setTables(prev => {
            const nextTables = (Array.isArray(prev) ? prev : []).map(t => {
              if (isSameTable(t.name, selectedTable) || isSameTable(t.full_name, selectedTable)) {
                return {
                  ...t,
                  status: remaining.length > 0 ? 'Reserved' : 'Free',
                  occupied: remaining.length > 0 ? 1 : 0,
                  items: remaining
                };
              }
              return t;
            });
            if (saveTableItemsToStorage) saveTableItemsToStorage(nextTables);
            return nextTables;
          });
        }
        showToast(`Split bill payment completed! Table ${selectedTable} remaining cart updated.`, 'success');
      } else {
        setPosCart([]);
      }
      setActiveSplitCart(null);
    } catch (e) {
      console.error('Error submitting POS payment:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    document.body.classList.add('printing-receipt');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-receipt');
      }, 500);
    }, 100);
  };

  const handleOpenMergeModal = () => {
    const defaultPrimary = selectedTable || (safeTables[0] ? safeTables[0].name : 'T01');
    setPrimaryTable(defaultPrimary);

    const otherActive = safeTables.find(t =>
      !isSameTable(t.name, defaultPrimary) &&
      (t.status === 'Reserved' || t.occupied == 1 || (Array.isArray(t.items) && t.items.length > 0))
    );
    const defaultSecondary = otherActive
      ? otherActive.name
      : safeTables.find(t => !isSameTable(t.name, defaultPrimary))?.name || 'T02';
    setSecondaryTable(defaultSecondary);
    setIsMergeModalOpen(true);
  };

  const handleConfirmMergeBill = async () => {
    if (!primaryTable || !secondaryTable) {
      showToast('Please select both Target Table and Source Table!', 'warning');
      return;
    }

    if (isSameTable(primaryTable, secondaryTable)) {
      showToast('Target Table and Source Table cannot be the same table!', 'warning');
      return;
    }

    // 1. Target Items
    let targetItems = [];
    const targetTableObj = safeTables.find(t => isSameTable(t.name, primaryTable) || isSameTable(t.full_name, primaryTable));
    if (selectedTable && isSameTable(selectedTable, primaryTable) && posCart.length > 0) {
      targetItems = [...posCart];
    } else if (targetTableObj && Array.isArray(targetTableObj.items) && targetTableObj.items.length > 0) {
      targetItems = [...targetTableObj.items];
    } else {
      try {
        const fetched = await fetchTableItemsFromBackend(primaryTable, menuItems);
        if (fetched && fetched.length > 0) targetItems = fetched;
      } catch (e) {}
    }

    // 2. Source Items
    let sourceItems = [];
    const sourceTableObj = safeTables.find(t => isSameTable(t.name, secondaryTable) || isSameTable(t.full_name, secondaryTable));
    if (selectedTable && isSameTable(selectedTable, secondaryTable) && posCart.length > 0) {
      sourceItems = [...posCart];
    } else if (sourceTableObj && Array.isArray(sourceTableObj.items) && sourceTableObj.items.length > 0) {
      sourceItems = [...sourceTableObj.items];
    } else {
      try {
        const fetched = await fetchTableItemsFromBackend(secondaryTable, menuItems);
        if (fetched && fetched.length > 0) sourceItems = fetched;
      } catch (e) {}
    }

    if (!sourceItems || sourceItems.length === 0) {
      showToast(`Source Table (${secondaryTable}) has no active items to merge!`, 'warning');
      return;
    }

    // 3. Combine items from both tables
    const combinedItems = [];
    const itemMap = new Map();

    const addOrMerge = (item) => {
      const code = item.item_code || item.item_name;
      if (itemMap.has(code)) {
        const existing = itemMap.get(code);
        existing.qty = (existing.qty || 1) + (item.qty || 1);
      } else {
        const copy = { ...item, qty: item.qty || 1 };
        itemMap.set(code, copy);
        combinedItems.push(copy);
      }
    };

    (targetItems || []).forEach(addOrMerge);
    (sourceItems || []).forEach(addOrMerge);

    // 4. Update Tables State & Persistent Storage
    setTables(prev => {
      const nextTables = (Array.isArray(prev) ? prev : []).map(t => {
        if (isSameTable(t.name, primaryTable) || isSameTable(t.full_name, primaryTable)) {
          return {
            ...t,
            status: 'Reserved',
            occupied: 1,
            items: combinedItems
          };
        }
        if (isSameTable(t.name, secondaryTable) || isSameTable(t.full_name, secondaryTable)) {
          return {
            ...t,
            status: 'Free',
            occupied: 0,
            current_order: null,
            items: []
          };
        }
        return t;
      });

      if (saveTableItemsToStorage) saveTableItemsToStorage(nextTables);
      return nextTables;
    });

    if (setKots) {
      setKots(prev => (Array.isArray(prev) ? prev : []).map(k => {
        if (isSameTable(k.table, secondaryTable) || isSameTable(k.restaurant_table, secondaryTable)) {
          return { ...k, table: primaryTable, restaurant_table: primaryTable };
        }
        return k;
      }));
    }

    if (setOrders) {
      setOrders(prev => (Array.isArray(prev) ? prev : []).map(o => {
        if (isSameTable(o.restaurant_table, secondaryTable) || isSameTable(o.type, secondaryTable)) {
          return { ...o, restaurant_table: primaryTable, type: primaryTable };
        }
        return o;
      }));
    }

    // 5. Update Current active POS cart view
    if (selectedTable && isSameTable(selectedTable, primaryTable)) {
      setPosCart(combinedItems);
    } else if (selectedTable && isSameTable(selectedTable, secondaryTable)) {
      setSelectedTable(primaryTable);
      setPosCart(combinedItems);
    }

    setIsMergeModalOpen(false);
    showToast(`Successfully merged Table ${secondaryTable} bill into Table ${primaryTable}! Table ${secondaryTable} is now free.`, 'success');
  };

  const defaultFoodImage = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80';

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      
      {/* Top POS Terminal Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-600 font-bold">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900">Speed POS Terminal</h2>
            <p className="text-[11px] text-gray-500 font-medium">Cashier: Ali Hassan | Active Terminal #1</p>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsOrdersModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-sm relative"
          >
            <Clock className="h-4 w-4" />
            <span>Orders & Kitchen Status</span>
            {safeOrders.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-blue-700 text-[10px] font-black">
                {safeOrders.length}
              </span>
            )}
          </button>

          {serviceType === 'Dine In' && (
            <button
              onClick={() => setIsTableModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-xs font-extrabold text-green-700 hover:bg-green-100 transition shadow-2xs"
            >
              <Grid className="h-4 w-4 text-green-600" /> {currentDisplayTable}
            </button>
          )}
          <button
            onClick={handleOpenSplitModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
          >
            <Scissors className="h-4 w-4 text-sky-600" /> Split Bill
          </button>
          <button
            onClick={handleOpenMergeModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
          >
            <GitMerge className="h-4 w-4 text-purple-600" /> Merge Bills
          </button>
          <button
            onClick={() => {
              if (lastInvoiceReceipt) setIsReceiptModalOpen(true);
              else showToast('No recent invoice receipt found.');
            }}
            className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
            title="Print Last Invoice Receipt"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Categories & Menu Grid */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Categories & Search */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="relative w-48 shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Quick search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none focus:border-green-600 font-medium"
              />
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredMenu.map(item => {
              const inCartItem = posCart.find(i => i.item_code === item.item_code);
              const qtyInCart = inCartItem ? inCartItem.qty : 0;

              return (
                <div
                  key={item.item_code}
                  onClick={() => handleAddItemToPosCart(item)}
                  className={`cursor-pointer bg-white p-3.5 rounded-2xl border transition duration-200 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-sm hover:shadow-md ${
                    qtyInCart > 0
                      ? 'border-green-600 bg-green-50/20'
                      : 'border-gray-200 hover:border-green-600'
                  }`}
                >
                  <div className="flex gap-3 items-center">
                    <div className="relative shrink-0">
                      <img
                        src={item.image || defaultFoodImage}
                        alt={item.item_name}
                        className="w-14 h-14 rounded-xl object-cover border border-gray-100 bg-gray-50"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = defaultFoodImage;
                        }}
                      />
                      {qtyInCart > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-600 text-white font-extrabold text-[11px] flex items-center justify-center shadow-md">
                          {qtyInCart}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-extrabold text-gray-900 line-clamp-1">{item.item_name}</h4>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[9.5px] font-semibold uppercase tracking-wider">
                        {item.course_label || item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm font-black text-green-700">Rs {item.price.toLocaleString()}</span>
                    {qtyInCart > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-extrabold text-[11px] border border-green-200">
                        {qtyInCart} in cart
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">
                        Tap to add
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Col: Active Order & Checkout Summary */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-col justify-between space-y-4 shadow-sm">
          
          <div className="space-y-3">

            {/* 3 Service Tabs (Dine In, Takeaway, Delivery) right above Current POS Bill */}
            <div className="grid grid-cols-3 gap-1 bg-gray-100/90 p-1 rounded-xl mb-3">
              {[
                { id: 'Dine In', label: 'Dine In', icon: Utensils },
                { id: 'Takeaway', label: 'Takeaway', icon: ShoppingBag },
                { id: 'Delivery', label: 'Delivery', icon: Truck }
              ].map(srv => {
                const Icon = srv.icon;
                const isActive = serviceType === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => handleServiceTypeChange(srv.id)}
                    className={`py-2 px-1.5 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-xs ring-1 ring-black/5'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="truncate">{srv.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bill Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-green-600" />
                  Current POS Bill ({serviceType})
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Live Frappe Order Terminal</p>
              </div>
              {serviceType === 'Dine In' && (
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 border border-green-200 text-xs font-black hover:bg-green-100 transition shadow-2xs"
                >
                  <Grid className="h-3.5 w-3.5 text-green-600" /> {currentDisplayTable}
                </button>
              )}
            </div>

            {/* Customer Selector Input */}
            <div className="flex items-center gap-2.5 bg-gray-50/80 px-3 py-2 rounded-xl border border-gray-200/70 focus-within:border-green-600 transition">
              <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name..."
                list="pos-customer-list"
                className="bg-transparent text-gray-900 font-semibold focus:outline-none w-full text-xs placeholder:text-gray-400 placeholder:font-normal"
              />
              <datalist id="pos-customer-list">
                {customers.map(c => (
                  <option key={c.id || c.name} value={c.name}>{c.name} ({c.phone || 'N/A'})</option>
                ))}
              </datalist>
            </div>

            {/* Compact Line Items List */}
            <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1 divide-y divide-gray-100">
              {posCart.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Utensils className="h-8 w-8 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-400 font-medium">
                    {serviceType === 'Dine In'
                      ? `Select a table above or click menu items to add to Table ${selectedTable}.`
                      : 'Cart is empty. Click menu items to add to order.'}
                  </p>
                </div>
              ) : (
                posCart.map(item => {
                  const itemTotal = item.price * item.qty;
                  return (
                    <div key={item.item_code} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 group hover:bg-gray-50/50 px-1 rounded-lg transition">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900 text-xs line-clamp-1 group-hover:text-green-700 transition">
                          {item.item_name}
                        </div>
                        <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                          Rs {item.price.toLocaleString()} <span className="text-gray-300">×</span> {item.qty}
                          {item.notes && <span className="text-amber-600 block text-[10px]">Note: {item.notes}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-black text-gray-900 block">
                            Rs {itemTotal.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center bg-gray-100/80 p-0.5 rounded-lg border border-gray-200/60">
                          <button
                            onClick={() => handleUpdateQty(item.item_code, -1)}
                            className="w-5 h-5 rounded-md flex items-center justify-center text-gray-600 hover:bg-white hover:text-red-600 hover:shadow-xs transition"
                            title="Decrease qty"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          
                          <span className="w-5 text-center font-extrabold text-gray-900 text-xs select-none">
                            {item.qty}
                          </span>

                          <button
                            onClick={() => handleUpdateQty(item.item_code, 1)}
                            className="w-5 h-5 rounded-md flex items-center justify-center text-gray-600 hover:bg-white hover:text-green-600 hover:shadow-xs transition"
                            title="Increase qty"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => setPosCart(prev => prev.filter(i => i.item_code !== item.item_code))}
                          className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 flex items-center justify-center transition shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Calculations & Pay Button */}
          <div className="border-t border-gray-100 pt-3 space-y-3">
            {/* Custom Discount Inputs (Dis % | Rs | Reset) */}
            <div className="bg-gray-100/90 p-2.5 rounded-xl border border-gray-200 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2 text-xs">
                
                {/* Dis % Input */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-extrabold text-gray-700 text-xs shrink-0 select-none">Dis %</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0 %"
                    value={disPercentInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setDisPercentInput(e.target.value)}
                    className="w-16 bg-white border border-gray-300 focus:border-green-600 px-2 py-1.5 rounded-lg font-extrabold text-gray-900 text-xs text-center outline-none shadow-2xs"
                  />
                </div>

                {/* Rs Input */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-extrabold text-gray-700 text-xs shrink-0 select-none">Rs</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={parsedPct > 0 ? (subtotal || 0).toString() : "0.00"}
                    value={disAmountInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setDisAmountInput(e.target.value)}
                    className="w-20 bg-white border border-gray-300 focus:border-green-600 px-2 py-1.5 rounded-lg font-extrabold text-gray-900 text-xs text-center outline-none shadow-2xs"
                  />
                </div>

                {/* Reset Button (RotateCcw icon) */}
                <button
                  type="button"
                  onClick={() => {
                    setDisPercentInput('');
                    setDisAmountInput('');
                  }}
                  className="p-2 rounded-lg bg-gray-200/80 hover:bg-gray-300 text-gray-700 transition shrink-0"
                  title="Reset Discount"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Discount breakdown hint */}
              {discountAmount > 0 && (
                <div className="text-[10.5px] font-bold text-green-700 flex justify-between items-center pt-1 border-t border-gray-200/60">
                  <span>
                    {parsedPct > 0
                      ? `${parsedPct}% on Rs ${(parsedRs > 0 ? parsedRs : subtotal).toLocaleString()}`
                      : `Flat Rupee Discount`}
                  </span>
                  <span className="font-black">-Rs {discountAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="space-y-1 text-xs bg-gray-50/80 p-3 rounded-xl border border-gray-200/60">
              <div className="flex justify-between text-gray-500 font-medium"><span>Subtotal</span><span className="font-bold text-gray-800">Rs {subtotal.toLocaleString()}</span></div>
              {discountAmount > 0 && <div className="flex justify-between text-red-600 font-medium"><span>Discount ({discountPercent}%)</span><span className="font-bold">-Rs {discountAmount.toLocaleString()}</span></div>}
              <div className="flex justify-between text-gray-500 font-medium"><span>Tax ({taxPercentDisplay})</span><span className="font-bold text-gray-800">Rs {taxAmount.toLocaleString()}</span></div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-purple-700 font-extrabold bg-purple-50/80 px-2 py-0.5 rounded border border-purple-100">
                  <span>🛵 Delivery Charge</span>
                  <span>+Rs {deliveryFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t border-gray-200/80">
                <span>Grand Total</span>
                <span className="text-green-600 text-base font-black">Rs {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setAmountTendered(grandTotal);
                setIsPaymentModalOpen(true);
              }}
              disabled={posCart.length === 0}
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <DollarSign className="h-4 w-4" /> PAY & COMPLETE BILL
            </button>
          </div>

        </div>

      </div>

      {/* POS Table Selector Modal */}
      <Modal isOpen={isTableModalOpen} onClose={() => setIsTableModalOpen(false)} title="Select Floor Table" maxWidth="max-w-3xl">
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-medium">
            Click any floor table below to load its current active order items into POS:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {safeTables.map(t => {
              const isSelected = selectedTable === t.name;
              const activeItemCount = getTableActiveItemCount(t.name);
              const isReserved = t.status === 'Reserved' || t.status === 'Busy' || t.occupied == 1;

              return (
                <div
                  key={t.name}
                  onClick={() => {
                    handleSelectTable(t.name);
                    setIsTableModalOpen(false);
                  }}
                  className={`cursor-pointer p-3.5 rounded-xl border transition duration-150 flex flex-col justify-between space-y-2 text-center relative shadow-2xs ${
                    isSelected
                      ? 'border-2 border-green-600 bg-green-50 shadow-md ring-2 ring-green-600/20'
                      : isReserved
                      ? 'border-purple-200 bg-purple-50/60 hover:border-purple-400'
                      : 'border-gray-200 bg-white hover:border-green-500 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-gray-900">{t.name}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${isReserved ? 'bg-purple-600' : 'bg-green-500'}`} />
                  </div>

                  <div className="text-[10.5px] font-bold text-gray-500 flex items-center justify-between">
                    <span>Seats: {t.capacity}</span>
                    <span className={isReserved ? 'text-purple-700 font-extrabold' : 'text-green-700 font-extrabold'}>
                      {isReserved ? 'Reserved' : 'Free'}
                    </span>
                  </div>

                  {activeItemCount > 0 && isReserved && (
                    <div className="mt-1 px-1.5 py-1 rounded-lg bg-[#f59e0b] text-white text-[9.5px] font-black uppercase tracking-wider shadow-2xs text-center">
                      {activeItemCount} ACTIVE ITEMS
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Payment Screen Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setActiveSplitCart(null);
        }}
        title={`POS Payment Checkout ${activeSplitCart ? '(Split Portion)' : ''}`}
      >
        <div className="space-y-6">
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
            <div className="flex justify-between text-xs text-gray-500"><span>Customer</span><span className="font-bold text-gray-900">{customerName}</span></div>
            <div className="flex justify-between text-xs text-gray-500"><span>Service Type / Table</span><span className="font-bold text-green-600">{serviceType === 'Dine In' ? `Dine-in (${selectedTable})` : serviceType}</span></div>
            {activeDeliveryFee > 0 && (
              <div className="flex justify-between text-xs text-purple-700 font-bold bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                <span>🛵 Delivery Fee</span>
                <span className="font-black">+Rs {activeDeliveryFee.toLocaleString()}</span>
              </div>
            )}
            {activeSplitCart && (
              <div className="flex justify-between text-xs text-sky-700 font-semibold bg-sky-50 px-2 py-1 rounded-md border border-sky-100">
                <span>Split Payment Mode</span>
                <span className="font-bold">{activeSplitCart.isEqualSplit ? `Equal Split Share` : `Selected ${activeSplitCart.items.length} Item(s)`}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total Payable Amount</span>
              <span className="text-green-600 text-lg font-black">Rs {activeGrandTotalToPay.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Method</label>
            <div className="grid grid-cols-3 gap-3">
              {['CASH', 'CARD', 'ONLINE'].map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-3 rounded-xl text-xs font-extrabold transition border ${
                    paymentMethod === m ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Received Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Amount Received (Cash Tendered)
              </label>
              <button
                type="button"
                onClick={() => setAmountTendered(activeGrandTotalToPay)}
                className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-extrabold transition shadow-2xs"
              >
                Exact (Rs {activeGrandTotalToPay.toLocaleString()})
              </button>
            </div>

            {/* Single Custom Amount Input Box */}
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-base font-black text-gray-400">Rs</span>
              <input
                type="number"
                min="0"
                placeholder="Type custom cash amount..."
                value={amountTendered === '' ? '' : amountTendered}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmountTendered(val === '' ? '' : Number(val));
                }}
                className="w-full bg-white border-2 border-gray-300 focus:border-green-600 pl-11 pr-20 py-3.5 rounded-xl text-xl font-black text-green-700 outline-none transition shadow-xs"
              />
              {amountTendered !== '' && (
                <button
                  type="button"
                  onClick={() => setAmountTendered('')}
                  className="absolute right-3 top-3.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Change Calculation */}
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center justify-between text-sm font-bold">
            <span className="text-gray-700">Change Due To Customer:</span>
            <span className="text-emerald-700 text-lg font-extrabold">Rs {changeDue.toLocaleString()}</span>
          </div>

          <button
            onClick={handleCompletePosPayment}
            disabled={isSubmitting || activeItemsToPay.length === 0}
            className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isSubmitting ? 'PROCESSING PAYMENT & CREATING INVOICE...' : `COMPLETE PAYMENT (Rs ${activeGrandTotalToPay.toLocaleString()}) & PRINT RECEIPT`}
          </button>
        </div>
      </Modal>

      {/* THERMAL POS RECEIPT MODAL */}
      {isReceiptModalOpen && lastInvoiceReceipt && (
        <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Official POS Tax Invoice & Receipt">
          <div className="space-y-4">
            
            {/* Thermal Slip Styled Card */}
            <div id="thermal-receipt" className="bg-white p-6 rounded-xl border border-gray-200 font-mono text-xs text-gray-900 space-y-3 max-w-sm mx-auto shadow-sm">
              
              {/* Brand Header */}
              <div className="text-center border-b border-dashed border-gray-400 pb-3">
                <h2 className="font-black text-base uppercase tracking-widest text-gray-900">URY RESTAURANT SUITE</h2>
                <p className="text-[11px] font-bold text-gray-700">Gulberg III Branch, Main Blvd, Lahore</p>
                <p className="text-[10px] text-gray-600">Tel: +92 42 111-879-879 | UAN: 042-35718900</p>
                <div className="mt-1.5 pt-1.5 border-t border-dotted border-gray-300 text-[10px] text-gray-700 font-semibold space-y-0.5">
                  <p>NTN Tax ID #: <span className="font-bold">8492048-1</span></p>
                  <p>PRA STRN Reg #: <span className="font-bold">17-00-8492-048-1</span></p>
                  <p className="text-[9px] text-gray-500">POS Machine ID: POS-TERMINAL-01</p>
                </div>
              </div>

              {/* Title Badge */}
              <div className="text-center py-1 bg-gray-100 rounded border border-gray-200">
                <span className="font-black text-[11px] uppercase tracking-wider text-gray-900">OFFICIAL POS TAX INVOICE</span>
              </div>

              {/* Metadata */}
              <div className="text-[11px] space-y-1 border-b border-dashed border-gray-400 pb-3">
                <div className="flex justify-between"><span className="text-gray-600">Invoice #:</span><span className="font-bold text-gray-900">{lastInvoiceReceipt.invoice}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Date / Time:</span><span>{lastInvoiceReceipt.date} {lastInvoiceReceipt.time}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Customer:</span><span className="font-bold text-gray-900">{lastInvoiceReceipt.customer}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Table / Type:</span><span className="font-bold text-gray-900">{lastInvoiceReceipt.table}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Payment Method:</span><span className="font-bold text-gray-900 uppercase">{lastInvoiceReceipt.paymentMethod}</span></div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 border-b border-dashed border-gray-400 pb-3">
                <div className="flex justify-between font-black text-[10px] text-gray-900 uppercase border-b border-gray-300 pb-1">
                  <span className="w-1/2 text-left">Item Description</span>
                  <span className="w-1/6 text-center">Qty</span>
                  <span className="w-1/3 text-right">Amount</span>
                </div>
                {(Array.isArray(lastInvoiceReceipt.items) ? lastInvoiceReceipt.items : []).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] leading-snug">
                    <div className="w-1/2 text-left">
                      <span className="font-bold text-gray-900 block truncate">{item.item_name}</span>
                      <span className="text-[10px] text-gray-500">@ Rs {Number(item.price || 0).toLocaleString()}</span>
                    </div>
                    <span className="w-1/6 text-center font-semibold text-gray-800">{item.qty}</span>
                    <span className="w-1/3 text-right font-bold text-gray-900">Rs {(item.qty * (item.price || 0)).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Financial Calculation */}
              <div className="space-y-1.5 text-[11px] pt-1">
                <div className="flex justify-between text-gray-700"><span>Subtotal:</span><span>Rs {Number(lastInvoiceReceipt.subtotal || 0).toLocaleString()}</span></div>
                
                {lastInvoiceReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>Discount ({lastInvoiceReceipt.discountPercent}%):</span>
                    <span>-Rs {Number(lastInvoiceReceipt.discountAmount || 0).toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-700">
                  <span>Sales Tax ({lastInvoiceReceipt.taxPercentDisplay || (lastInvoiceReceipt.paymentMethod === 'CARD' || lastInvoiceReceipt.paymentMethod === 'ONLINE' ? '8%' : '16%')}):</span>
                  <span>Rs {Number(lastInvoiceReceipt.taxAmount || 0).toLocaleString()}</span>
                </div>

                {lastInvoiceReceipt.deliveryFee > 0 && (
                  <div className="flex justify-between text-purple-800 font-bold">
                    <span>Delivery Charge:</span>
                    <span>+Rs {Number(lastInvoiceReceipt.deliveryFee).toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between font-black text-sm text-gray-900 pt-2 border-t-2 border-gray-900">
                  <span>GRAND TOTAL:</span>
                  <span>Rs {Number(lastInvoiceReceipt.grandTotal || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-[11px] pt-1 text-gray-700">
                  <span>Cash Tendered:</span>
                  <span className="font-semibold">Rs {Number(lastInvoiceReceipt.amountTendered || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-green-700">
                  <span>Change Returned:</span>
                  <span>Rs {Number(lastInvoiceReceipt.changeDue || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Tax Verification & Barcode */}
              <div className="text-center pt-3 border-t border-dashed border-gray-400 space-y-1">
                <p className="text-[9px] font-bold text-gray-600 uppercase">FBR / PRA POS Invoicing System Integrated</p>
                <div className="my-1 font-mono text-[14px] font-extrabold tracking-widest text-gray-800 border-y border-dotted border-gray-300 py-1 select-none">
                  ||||| | ||||| || ||| |||||
                </div>
                <p className="text-[9px] font-mono text-gray-500">Ref: *{lastInvoiceReceipt.invoice}*</p>
              </div>

              {/* Footer */}
              <div className="text-center pt-2 border-t border-dashed border-gray-300 text-[10px] text-gray-600 space-y-0.5">
                <p className="font-bold text-gray-800">Thank you for dining with us!</p>
                <p className="text-[9px] text-gray-500">Please retain this tax receipt for verification.</p>
                <p className="font-bold text-gray-700 mt-1 text-[9.5px]">Software Powered by URY Suite</p>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Close Window
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-2"
              >
                <Printer className="h-4 w-4" /> Print Thermal Receipt
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* Split Bill Modal */}
      {isSplitModalOpen && (
        <Modal isOpen={isSplitModalOpen} onClose={() => setIsSplitModalOpen(false)} title="Split Bill Terminal" maxWidth="max-w-xl">
          <div className="space-y-4">
            
            {/* Split Mode Tabs: By Items vs Equal 50/50 */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSplitMode('items')}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition ${splitMode === 'items' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Split By Line Items
              </button>
              <button
                type="button"
                onClick={() => setSplitMode('equal')}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition ${splitMode === 'equal' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Equal (50/50) Split
              </button>
            </div>

            {splitMode === 'items' ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-medium">Select items or quantities to move to separate split bill:</p>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 divide-y divide-gray-100 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  {posCart.map(item => {
                    const sQty = splitSelectedMap[item.item_code] || 0;
                    const isSelected = sQty > 0;

                    return (
                      <div key={item.item_code} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSplitItem(item.item_code, item.qty)}
                            className="accent-green-600 h-4 w-4 rounded cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 block line-clamp-1">{item.item_name}</span>
                            <span className="text-[11px] text-gray-500">Rs {item.price.toLocaleString()} each (Max: {item.qty})</span>
                          </div>
                        </div>

                        {/* Quantity Counter for partial splits */}
                        <div className="flex items-center gap-2 shrink-0">
                          {item.qty > 1 && (
                            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateSplitQty(item.item_code, -1, item.qty)}
                                className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center font-black text-xs">{sQty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateSplitQty(item.item_code, 1, item.qty)}
                                className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <span className="font-extrabold text-green-700 min-w-[60px] text-right">
                            Rs {((item.price || 0) * sQty).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals Summary */}
                {(() => {
                  const { splitSubtotal, remainingSubtotal, splitItems } = calculateSplitTotals();
                  return (
                    <div className="bg-sky-50/80 p-3 rounded-xl border border-sky-200 space-y-1.5 text-xs">
                      <div className="flex justify-between text-sky-900 font-bold">
                        <span>Selected Split Portion ({splitItems.reduce((a,b)=>a+b.qty,0)} Items):</span>
                        <span className="font-black text-sky-950 text-sm">Rs {splitSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 font-medium border-t border-sky-200/60 pt-1">
                        <span>Remaining Main Bill Total:</span>
                        <span className="font-extrabold text-gray-900">Rs {remainingSubtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsSplitModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedSplitPayment}
                    disabled={calculateSplitTotals().splitItems.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <CreditCard className="h-4 w-4" /> Pay Split Portion Now
                  </button>
                </div>
              </div>
            ) : (
              /* Equal Split Mode */
              <div className="space-y-4">
                <p className="text-xs text-gray-500 font-medium">Divide total bill into equal guest payments:</p>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-700">Split into:</span>
                  <div className="flex items-center gap-2">
                    {[2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSplitParts(num)}
                        className={`w-9 h-9 rounded-xl font-black text-xs transition ${
                          splitParts === num ? 'bg-sky-600 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const currentSubtotal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
                  const equalPortion = Math.round(currentSubtotal / splitParts);
                  return (
                    <div className="bg-sky-50 p-4 rounded-xl border border-sky-200 text-center space-y-1">
                      <div className="text-xs font-bold text-sky-800 uppercase tracking-wider">Per Person Payment ({splitParts} Guest Split)</div>
                      <div className="text-2xl font-black text-sky-950">Rs {equalPortion.toLocaleString()}</div>
                      <div className="text-[11px] text-sky-700">Total Bill: Rs {currentSubtotal.toLocaleString()}</div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsSplitModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentSubtotal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
                      const equalPortion = Math.round(currentSubtotal / splitParts);
                      setActiveSplitCart({
                        items: posCart.map(i => ({ ...i, price: Math.round(i.price / splitParts) })),
                        subtotal: equalPortion,
                        isEqualSplit: true
                      });
                      setIsSplitModalOpen(false);
                      setIsPaymentModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <CreditCard className="h-4 w-4" /> Pay Equal 1/{splitParts} Share
                  </button>
                </div>
              </div>
            )}

          </div>
        </Modal>
      )}

      {/* Merge Table Bills Modal */}
      <Modal isOpen={isMergeModalOpen} onClose={() => setIsMergeModalOpen(false)} title="Merge Table Bills" maxWidth="max-w-xl">
        <div className="space-y-4">
          <p className="text-xs text-gray-500 font-medium">
            Combine items and bills from a source table into a target table. The source table will be cleared and freed automatically.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Table Selector */}
            <div className="space-y-1.5 bg-green-50/60 p-3.5 rounded-xl border border-green-200">
              <label className="text-xs font-black text-green-900 uppercase tracking-wider block">
                1. Target Table (Receives Bill)
              </label>
              <select
                value={primaryTable}
                onChange={(e) => setPrimaryTable(e.target.value)}
                className="w-full bg-white border border-green-300 focus:border-green-600 p-2.5 rounded-lg text-xs font-bold text-gray-900 outline-none"
              >
                {safeTables.map(t => {
                  const itemCount = (selectedTable && isSameTable(t.name, selectedTable) && posCart.length > 0)
                    ? posCart.length
                    : (t.items ? t.items.length : 0);
                  return (
                    <option key={`pri-${t.name}`} value={t.name}>
                      Table {t.name} ({itemCount > 0 ? `${itemCount} active item(s)` : 'Free'})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Source Table Selector */}
            <div className="space-y-1.5 bg-purple-50/60 p-3.5 rounded-xl border border-purple-200">
              <label className="text-xs font-black text-purple-900 uppercase tracking-wider block">
                2. Source Table (To Merge & Free)
              </label>
              <select
                value={secondaryTable}
                onChange={(e) => setSecondaryTable(e.target.value)}
                className="w-full bg-white border border-purple-300 focus:border-purple-600 p-2.5 rounded-lg text-xs font-bold text-gray-900 outline-none"
              >
                {safeTables.map(t => {
                  const itemCount = (selectedTable && isSameTable(t.name, selectedTable) && posCart.length > 0)
                    ? posCart.length
                    : (t.items ? t.items.length : 0);
                  return (
                    <option key={`sec-${t.name}`} value={t.name}>
                      Table {t.name} ({itemCount > 0 ? `${itemCount} active item(s)` : 'Free'})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Table Items Preview */}
          {(() => {
            const targetObj = safeTables.find(t => isSameTable(t.name, primaryTable));
            const sourceObj = safeTables.find(t => isSameTable(t.name, secondaryTable));
            const tItems = (selectedTable && isSameTable(selectedTable, primaryTable) && posCart.length > 0) ? posCart : (targetObj?.items || []);
            const sItems = (selectedTable && isSameTable(selectedTable, secondaryTable) && posCart.length > 0) ? posCart : (sourceObj?.items || []);

            const tTotal = tItems.reduce((a, b) => a + ((b.price || 0) * (b.qty || 1)), 0);
            const sTotal = sItems.reduce((a, b) => a + ((b.price || 0) * (b.qty || 1)), 0);

            return (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-gray-700">
                  <span>Target Table {primaryTable} Current Total:</span>
                  <span className="text-green-700 font-extrabold">Rs {tTotal.toLocaleString()} ({tItems.length} items)</span>
                </div>
                <div className="flex justify-between font-bold text-gray-700">
                  <span>Source Table {secondaryTable} Bill to Merge:</span>
                  <span className="text-purple-700 font-extrabold">+ Rs {sTotal.toLocaleString()} ({sItems.length} items)</span>
                </div>
                <div className="flex justify-between font-black text-sm text-gray-900 pt-2 border-t border-gray-200">
                  <span>Combined Merged Total:</span>
                  <span className="text-green-600 text-base font-black">Rs {(tTotal + sTotal).toLocaleString()}</span>
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsMergeModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmMergeBill}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <GitMerge className="h-4 w-4" /> Confirm & Merge Table Bills
            </button>
          </div>
        </div>
      </Modal>

      {/* ALL ORDERS & KITCHEN STATUS MODAL */}
      {isOrdersModalOpen && (
        <Modal
          isOpen={isOrdersModalOpen}
          onClose={() => setIsOrdersModalOpen(false)}
          title="Live POS & Mobile App Orders Status"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            {/* Controls: Search + Filter Pills */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'All Orders' },
                  { id: 'delivery', label: '🛵 Delivery' },
                  { id: 'takeaway', label: '🛍️ Takeaway' },
                  { id: 'dinein', label: '🍽️ Dine In' },
                  { id: 'unpaid', label: '⏳ Unpaid' },
                  { id: 'paid', label: '💳 Paid' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOrdersFilterTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      ordersFilterTab === tab.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoice, customer, item..."
                  value={ordersSearchQuery}
                  onChange={(e) => setOrdersSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            {/* Orders List / Cards Grid */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredOrdersList.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                  <Clock className="h-10 w-10 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-500 font-bold">No live orders found matching your filter criteria.</p>
                </div>
              ) : (
                filteredOrdersList.map(order => {
                  const isPaid = order.status === 'Paid' || (order.paid >= order.amount && order.amount > 0);
                  const kStatus = order.kitchen_status || order.status || 'Preparing';

                  let kBadgeBg = 'bg-blue-100 text-blue-800 border-blue-200';
                  if (kStatus === 'Served') kBadgeBg = 'bg-emerald-500 text-white';
                  else if (kStatus === 'Ready') kBadgeBg = 'bg-amber-500 text-white';
                  else if (kStatus === 'Preparing') kBadgeBg = 'bg-orange-100 text-orange-800 border-orange-200';
                  else if (kStatus === 'Paid') kBadgeBg = 'bg-green-600 text-white';

                  const rawType = (order.order_type || order.type || '').toLowerCase();
                  let channelBadge = '🍽️ Dine In';
                  let channelBg = 'bg-gray-100 text-gray-800';
                  if (rawType.includes('delivery')) {
                    channelBadge = '🛵 Delivery';
                    channelBg = 'bg-purple-100 text-purple-800 border-purple-200';
                  } else if (rawType.includes('take') || rawType.includes('pickup')) {
                    channelBadge = '🛍️ Takeaway';
                    channelBg = 'bg-teal-100 text-teal-800 border-teal-200';
                  } else if (order.restaurant_table) {
                    channelBadge = `🍽️ Table ${order.restaurant_table}`;
                    channelBg = 'bg-blue-50 text-blue-800 border-blue-200';
                  }

                  return (
                    <div key={order.invoice || order.name} className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-blue-500 transition space-y-3 shadow-2xs">
                      {/* Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-gray-900">{order.invoice}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${channelBg}`}>
                            {channelBadge}
                          </span>
                          {order.from_mobile && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black">
                              📱 MOBILE APP
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Kitchen Status */}
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-2xs ${kBadgeBg}`}>
                            KITCHEN: {kStatus.toUpperCase()}
                          </span>
                          {/* Payment Badge */}
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                            isPaid ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {isPaid ? 'PAYMENT: PAID' : 'PAYMENT: UNPAID'}
                          </span>
                        </div>
                      </div>

                      {/* Customer & Time Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 font-medium block">Customer:</span>
                          <span className="font-extrabold text-gray-900">{order.customer || 'Walk-in Guest'}</span>
                          {order.phone && <span className="text-gray-500 text-[11px] block">{order.phone}</span>}
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium block">Order Time:</span>
                          <span className="font-bold text-gray-800">{order.time || order.date || 'Today'}</span>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-gray-400 font-medium block">Grand Total:</span>
                          <span className="text-sm font-black text-green-700">Rs {Number(order.amount || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Items line items summary */}
                      {Array.isArray(order.items) && order.items.length > 0 && (
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs space-y-1">
                          <div className="font-bold text-gray-500 text-[10px] uppercase tracking-wider">Ordered Items ({order.items.length}):</div>
                          <div className="flex flex-wrap gap-2">
                            {order.items.map((it, idx) => (
                              <span key={idx} className="bg-white px-2 py-1 rounded-lg border border-gray-200 text-gray-800 font-semibold text-[11px]">
                                <span className="font-black text-green-700">{it.qty}x</span> {it.item_name || it.item_code}
                                <span className="text-gray-400 font-normal ml-1">(Rs {it.price})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleLoadOrderToCart(order)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-extrabold transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> Load into Cart
                        </button>

                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => {
                              handleLoadOrderToCart(order);
                              setAmountTendered(order.amount);
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs"
                          >
                            <CreditCard className="h-3.5 w-3.5" /> Pay Now (Rs {Number(order.amount || 0).toLocaleString()})
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleViewOrderReceipt(order)}
                          className="px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Printer className="h-3.5 w-3.5" /> View Receipt
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

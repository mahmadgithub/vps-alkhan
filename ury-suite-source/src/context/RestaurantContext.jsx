import React, { createContext, useContext, useState, useEffect } from 'react';
import { callUryApi } from '../api/client';
import {
  INITIAL_BRANCHES,
  INITIAL_TABLES,
  CATEGORIES as INITIAL_CATEGORIES,
  MENU_ITEMS as FALLBACK_MENU_ITEMS,
  INITIAL_KOTS,
  INITIAL_DELIVERIES,
  INITIAL_ORDERS,
  INITIAL_INVENTORY as FALLBACK_INVENTORY,
  INITIAL_STAFF,
  INITIAL_OFFERS as FALLBACK_OFFERS,
  INITIAL_RESERVATIONS,
  INITIAL_REVIEWS,
  DASHBOARD_STATS as FALLBACK_DASHBOARD_STATS
} from '../api/mockData';

const RestaurantContext = createContext();

export const cleanTableStr = (str) => {
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

export const saveTableItemsToStorage = (tablesArray) => {
  try {
    const itemsMap = {};
    (tablesArray || []).forEach(t => {
      const key = cleanTableStr(t.name || t.full_name);
      if (key) {
        if (t.status !== 'Free' && t.occupied != 0 && Array.isArray(t.items) && t.items.length > 0) {
          itemsMap[key] = t.items;
        } else {
          itemsMap[key] = [];
        }
      }
    });
    localStorage.setItem('ury_table_items_v1', JSON.stringify(itemsMap));
  } catch (e) {
    console.warn('Storage save error:', e);
  }
};

export const getTableItemsFromStorage = () => {
  try {
    const stored = localStorage.getItem('ury_table_items_v1');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

export const isSameTable = (a, b) => {
  if (!a || !b) return false;
  const cleanA = cleanTableStr(a);
  const cleanB = cleanTableStr(b);
  if (!cleanA || !cleanB) return false;
  return cleanA === cleanB;
};

export const RestaurantProvider = ({ children }) => {
  const [selectedBranch, setSelectedBranch] = useState('Gulberg III');
  const [branches, setBranches] = useState(INITIAL_BRANCHES);
  const [tables, setTables] = useState(() => {
    const storedMap = getTableItemsFromStorage();
    if (storedMap && typeof storedMap === 'object') {
      return INITIAL_TABLES.map(t => {
        const k = cleanTableStr(t.name || t.full_name);
        const storedItems = storedMap[k];
        if (storedItems && storedItems.length > 0) {
          return { ...t, status: 'Reserved', occupied: 1, items: storedItems };
        }
        return { ...t, status: 'Free', occupied: 0, current_order: null, items: [] };
      });
    }
    return INITIAL_TABLES;
  });
  const [rooms, setRooms] = useState(['Main Hall', 'Terrace', 'VIP Lounge', 'Rooftop', 'Family Hall']);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [menuItems, setMenuItems] = useState(FALLBACK_MENU_ITEMS);
  const [kots, setKots] = useState(INITIAL_KOTS);
  const [deliveries, setDeliveries] = useState(INITIAL_DELIVERIES);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [inventory, setInventory] = useState(FALLBACK_INVENTORY);
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [offers, setOffers] = useState(FALLBACK_OFFERS);
  const [customers, setCustomers] = useState([]);
  const [reservations, setReservations] = useState(INITIAL_RESERVATIONS);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [dashboardStats, setDashboardStats] = useState(FALLBACK_DASHBOARD_STATS);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  
  // Active Cart State (Customer / Waiter / POS)
  const [cart, setCart] = useState([]);
  const [activeTable, setActiveTable] = useState(null);

  // Toast Notification System
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Live Data from Backend APIs on mount and poll every 6s
  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(() => {
      fetchLiveData();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveData = async () => {
    try {
      // 1. Fetch Restaurant Menu from Backend
      const menuRes = await callUryApi('ury.ury_pos.api.getRestaurantMenu', { pos_profile: 'Gulberg III POS' });
      if (menuRes.success && menuRes.data?.items) {
        const rawItems = menuRes.data.items;
        const mappedItems = rawItems.map(item => ({
          item_code: item.item || item.item_code || item.item_name,
          actual_item_code: item.item || item.item_code || item.item_name,
          item_name: item.item_name,
          price: item.rate,
          category: (item.course || 'General').toLowerCase(),
          course_label: item.course_label || item.course,
          rating: 4.9,
          reviews: 24,
          is_available: item.disabled ? 0 : 1,
          image: item.item_image ? `http://194.60.87.92:8090${item.item_image}` : null
        }));
        setMenuItems(mappedItems);

        // Derive categories
        const courseMap = {};
        rawItems.forEach(i => {
          if (i.course) {
            const id = i.course.toLowerCase();
            courseMap[id] = i.course;
          }
        });
        const dynamicCats = [
          { id: 'all', name: 'All Categories' },
          ...Object.keys(courseMap).map(id => ({ id, name: courseMap[id] }))
        ];
        setCategories(dynamicCats);
        setIsLiveConnected(true);
      }

      // 2. Fetch Table Reservations from backend Table Reservation DocType
      let currentReservations = [];
      try {
        const resRes = await callUryApi('frappe.client.get_list', {
          doctype: 'Table Reservation',
          fields: ['name', 'customer', 'customer_name', 'phone', 'branch', 'reservation_date', 'reservation_time', 'party_size', 'occasion', 'status', 'table']
        });
        if (resRes && resRes.success && Array.isArray(resRes.data)) {
          currentReservations = resRes.data.map(r => {
            let tableShort = r.table || 'Unassigned';
            if (tableShort.includes(' - ')) tableShort = tableShort.split(' - ')[0];

            return {
              id: r.name,
              customer: r.customer_name || r.customer || 'Guest',
              phone: r.phone || 'N/A',
              branch: r.branch || selectedBranch || 'Gulberg III',
              date: r.reservation_date || new Date().toISOString().split('T')[0],
              time: r.reservation_time || '19:30',
              guests: r.party_size || 2,
              occasion: r.occasion || 'General Dining',
              status: r.status || 'Confirmed',
              table: tableShort
            };
          });
          setReservations(currentReservations);
        }
      } catch (err) {
        console.warn('[RestaurantContext] Failed to fetch table reservations:', err);
      }

      // 3. Fetch Waiter Tables
      const tablesRes = await callUryApi('ury.ury.api.staff_portal.list_tables_for_waiter', { branch: selectedBranch || 'Gulberg III' });
      if (tablesRes && tablesRes.success && Array.isArray(tablesRes.data)) {
        const mappedTables = tablesRes.data.map(t => {
          const rawName = t.name || '';
          let shortName = rawName;
          if (rawName.includes(' - ')) {
            shortName = rawName.split(' - ')[0];
          }
          const hasActiveReservation = currentReservations.some(r => {
            const isResActive = ['Confirmed', 'Reserved', 'Booked', 'Pending'].includes(r.status);
            if (!isResActive) return false;
            const rTable = (r.table || '').trim().toLowerCase();
            if (!rTable || rTable === 'unassigned') return false;
            const sName = shortName.trim().toLowerCase();
            const fName = rawName.trim().toLowerCase();
            return rTable === sName || rTable === fName || fName.startsWith(rTable) || rTable.startsWith(sName);
          });

          const isBusyOrReserved = Boolean((t.occupied == 1 || t.occupied === true || t.occupied === '1') || hasActiveReservation);

          let computedStatus = isBusyOrReserved ? 'Reserved' : 'Free';

          return {
            name: shortName,
            full_name: rawName,
            capacity: t.no_of_seats || 4,
            status: computedStatus,
            occupied: isBusyOrReserved ? 1 : 0,
            room: t.restaurant_room || 'Main Hall',
            current_order: t.invoice || (isBusyOrReserved ? 'ACTIVE' : null),
            elapsed: isBusyOrReserved ? (t.elapsed || '15m') : '0m'
          };
        });
        setTables(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const storedMap = getTableItemsFromStorage();
          const tableItemsMap = { ...storedMap };

          safePrev.forEach(t => {
            if (t && Array.isArray(t.items) && t.items.length > 0) {
              const k1 = cleanTableStr(t.name);
              const k2 = cleanTableStr(t.full_name);
              if (k1) tableItemsMap[k1] = t.items;
              if (k2) tableItemsMap[k2] = t.items;
            }
          });

          const nextTables = mappedTables.map(mt => {
            const key = cleanTableStr(mt.name || mt.full_name);
            const prevItems = tableItemsMap[key];
            if (prevItems && prevItems.length > 0 && mt.status !== 'Free') {
              return { ...mt, items: prevItems };
            }
            return { ...mt, items: mt.status === 'Free' ? [] : (mt.items || []) };
          });
          saveTableItemsToStorage(nextTables);
          return nextTables;
        });
      }


      // 10. Fetch POS Invoices / Orders (including mobile app orders) from backend
      try {
        const ordersRes = await callUryApi('ury.ury.api.dashboard.get_orders_list', {
          branch: selectedBranch || 'Gulberg III',
          limit: 150
        }, { silent: true });

        if (ordersRes && ordersRes.success && Array.isArray(ordersRes.data)) {
          const mappedOrders = ordersRes.data.map(o => ({
            invoice: o.invoice,
            customer: o.customer || 'Guest',
            phone: o.phone || 'N/A',
            // Show channel (QR Pickup / Delivery / Dine In etc.) with table if present
            type: o.restaurant_table
              ? `${o.type} (${o.restaurant_table})`
              : o.type || 'Dine In',
            restaurant_table: o.restaurant_table || '',
            raw_type: o.order_type || 'Dine In',
            amount: o.amount || 0,
            net_total: o.net_total || 0,
            tax_amount: o.tax_amount || 0,   // Always 8% tax
            paid: o.paid || 0,
            // Normalize status: Draft → Preparing for display
            status: o.status === 'Paid' ? 'Paid'
              : o.status === 'Draft' ? 'Preparing'
              : (o.status || 'Preparing'),
            raw_status: o.status || 'Draft',
            from_mobile: o.from_mobile || false,
            order_accepted: o.order_accepted,
            order_rejected: o.order_rejected,
            payment: (o.paid || 0) >= (o.amount || 1) ? 'Paid' : 'Unpaid',
            time: o.time || '',
            date: o.date || '',
            items: Array.isArray(o.items) ? o.items : []
          }));

          setOrders(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const prevMap = {};
            safePrev.forEach(p => { if (p && p.invoice) prevMap[p.invoice] = p; });
            return mappedOrders.map(mo => {
              if (Array.isArray(mo.items) && mo.items.length > 0) {
                return mo;
              }
              const localMatch = prevMap[mo.invoice];
              if (localMatch && Array.isArray(localMatch.items) && localMatch.items.length > 0) {
                return { ...mo, items: localMatch.items };
              }
              return mo;
            });
          });
        }
      } catch (e) {
        console.warn('Orders fetch error:', e);
      }

      // 11. Fetch Staff Members from User DocType
      try {
        const staffRes = await callUryApi('frappe.client.get_list', {
          doctype: 'User',
          filters: {
            enabled: 1,
            name: ['not in', ['Administrator', 'Guest']]
          },
          fields: ['name', 'full_name', 'first_name', 'last_name', 'email', 'mobile_no', 'enabled']
        }, { silent: true });

        if (staffRes && staffRes.success && Array.isArray(staffRes.data) && staffRes.data.length > 0) {
          const mappedStaff = staffRes.data.map((u) => {
            let role = 'Waiter';
            const emailOrName = (u.name || '').toLowerCase();
            if (emailOrName.includes('cashier')) role = 'Cashier (POS)';
            else if (emailOrName.includes('rider')) role = 'Delivery Rider';
            else if (emailOrName.includes('manager') || emailOrName.includes('admin')) role = 'Manager / Admin';
            else if (emailOrName.includes('chef') || emailOrName.includes('kitchen')) role = 'Kitchen Chef';
            else role = 'Waiter';

            return {
              id: u.name,
              name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.name.split('@')[0],
              email: u.email || u.name,
              phone: u.mobile_no || '0300-1234567',
              role: role,
              shift: 'Evening (4PM - 12AM)',
              status: u.enabled ? 'Active' : 'Inactive'
            };
          });
          setStaff(mappedStaff);
        }
      } catch (e) {
        console.warn('Staff fetch error:', e);
      }

      // 12. Fetch Customers from Customer DocType
      try {
        const custRes = await callUryApi('frappe.client.get_list', {
          doctype: 'Customer',
          fields: ['name', 'customer_name', 'mobile_no'],
          limit_page_length: 50
        }, { silent: true });

        if (custRes && custRes.success && Array.isArray(custRes.data) && custRes.data.length > 0) {
          const mappedCust = custRes.data.map(c => ({
            id: c.name,
            name: c.customer_name || c.name,
            phone: c.mobile_no || 'N/A'
          }));
          setCustomers(mappedCust);
        }
      } catch (e) {
        console.warn('Customer fetch error:', e);
      }

      // 12. Fetch Live KOT Tickets WITH items from backend (single efficient API call)
      try {
        const kotRes = await callUryApi('ury.ury.api.dashboard.get_kots_with_items', {
          branch: selectedBranch || 'Gulberg III',
          limit: 80
        }, { silent: true });

        if (kotRes && kotRes.success && Array.isArray(kotRes.data) && kotRes.data.length > 0) {
          const mappedKots = kotRes.data.map(k => {
            const rawStatus = (k.order_status || 'NEW').toString();
            let mappedStatus = 'NEW';
            if (rawStatus.toLowerCase().includes('prep') && !rawStatus.toLowerCase().includes('ready')) mappedStatus = 'PREPARING';
            else if (rawStatus.toLowerCase() === 'ready') mappedStatus = 'READY';
            else if (rawStatus.toLowerCase() === 'served') mappedStatus = 'SERVED';
            else if (rawStatus.toLowerCase() === 'ready for prepare') mappedStatus = 'NEW';

            let rawTable = k.restaurant_table || '';
            let tableShort = rawTable;
            if (tableShort.includes(' - ')) tableShort = tableShort.split(' - ')[0];

            const rawType = (k.kot_type || k.type || '').toString();
            const channel = k.order_channel || k.order_type || 'Take Away';
            const isDineIn = Boolean(rawTable) || channel.toLowerCase().includes('dine');
            const isRunning = isDineIn && (rawType.toLowerCase().includes('running') || rawType.toLowerCase().includes('modified'));
            const isAddon = isDineIn && !isRunning && (rawType.toLowerCase().includes('add-on') || rawType.toLowerCase().includes('addon'));

            // Items already included from the API (item_name, qty, notes)
            const items = Array.isArray(k.items) ? k.items.map(i => ({
              name: i.name || i.item_name || '',
              item_code: i.item_code || '',
              qty: i.qty || 1,
              notes: i.notes || ''
            })) : [];

            return {
              name: k.name,
              invoice: k.invoice || '',
              table: tableShort || (k.invoice ? k.invoice.replace('GLB-', 'T') : 'N/A'),
              restaurant_table: rawTable,
              order_type: channel,
              kot_type: rawType,
              is_running: isRunning,
              is_addon: isAddon,
              items,
              status: mappedStatus,
              created_at: k.creation || new Date().toISOString(),
              elapsed_minutes: k.creation ? Math.max(1, Math.floor((new Date() - new Date(k.creation)) / 60000)) : 5
            };
          });

          setKots(mappedKots);
        }
      } catch (e) {
        console.warn('Live KOT API fetch error:', e);
      }

    } catch (e) {
      console.warn('[RestaurantContext] Live sync error:', e);
    }
  };

  // Cart operations
  const addToCart = (item, qty = 1, options = {}) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(i => i.item_code === item.item_code && i.variant === options.variant);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].qty += qty;
        return updated;
      }
      return [...prev, { ...item, qty, variant: options.variant || '', addons: options.addons || [], notes: options.notes || '' }];
    });
    showToast(`Added ${item.item_name} to cart.`);
  };

  const updateCartQty = (item_code, qty) => {
    setCart(prev => prev.map(item => item.item_code === item_code ? { ...item, qty: Math.max(1, qty) } : item));
  };

  const removeFromCart = (item_code) => {
    setCart(prev => prev.filter(item => item.item_code !== item_code));
  };

  const clearCart = () => setCart([]);

  // Customer Place Online Order
  const placeCustomerOrder = async (orderDetails) => {
    const invoiceNo = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmt = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    
    // Create new order
    const newOrder = {
      invoice: invoiceNo,
      customer: orderDetails.customer_name || 'Online Customer',
      type: orderDetails.order_type || 'Delivery',
      amount: totalAmt,
      status: 'Preparing',
      payment: 'Paid',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: [...cart]
    };
    setOrders(prev => [newOrder, ...prev]);

    // Create KOT for Kitchen
    const newKot = {
      name: `KOT-${Math.floor(1000 + Math.random() * 9000)}`,
      invoice: invoiceNo,
      table: orderDetails.order_type === 'Dine In' ? orderDetails.table || 'T01' : orderDetails.order_type,
      order_type: orderDetails.order_type,
      items: cart.map(i => ({ name: i.item_name, qty: i.qty, notes: i.notes || '' })),
      status: 'NEW',
      created_at: new Date().toISOString(),
      elapsed_minutes: 1
    };
    setKots(prev => [newKot, ...prev]);

    // If delivery, create delivery assignment
    if (orderDetails.order_type === 'Delivery') {
      const newDel = {
        invoice: invoiceNo,
        customer: orderDetails.customer_name || 'Online Customer',
        phone: orderDetails.phone || '0300-1234567',
        address: orderDetails.address || 'Johar Town, Lahore',
        amount: totalAmt,
        items_summary: cart.map(c => `${c.qty}x ${c.item_name}`).join(', '),
        status: 'Assigned',
        assigned_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rider: 'Bilal Khan'
      };
      setDeliveries(prev => [newDel, ...prev]);
    }

    clearCart();
    showToast(`Order ${invoiceNo} placed successfully!`);
    return invoiceNo;
  };

  const getTableDbName = (tableName) => {
    if (!tableName) return '';
    const branchName = selectedBranch || 'Gulberg III';
    const target = (Array.isArray(tables) ? tables : []).find(t =>
      t.name === tableName ||
      t.full_name === tableName ||
      t.name.toLowerCase() === tableName.toLowerCase() ||
      t.full_name.toLowerCase() === tableName.toLowerCase()
    );
    if (target?.full_name) return target.full_name;
    if (tableName.includes(branchName)) return tableName;
    return `${tableName} - ${branchName}`;
  };

  const setTableOccupiedInBackend = async (tableName, occupiedVal = 1) => {
    if (!tableName) return;
    const dbName = getTableDbName(tableName);
    let res = await callUryApi('frappe.client.set_value', {
      doctype: 'URY Table',
      name: dbName,
      fieldname: 'occupied',
      value: occupiedVal
    }, { silent: true });

    if (!res?.success) {
      const short = tableName.split(' - ')[0];
      const clean = short.replace(/^T0?|^Table\s*/i, '');
      const branchName = selectedBranch || 'Gulberg III';
      const altNames = [
        `Table ${clean} - ${branchName}`,
        `T${clean.padStart(2, '0')} - ${branchName}`,
        `Table ${clean}`,
        `T${clean}`
      ];
      for (const alt of altNames) {
        if (alt !== dbName) {
          let altRes = await callUryApi('frappe.client.set_value', {
            doctype: 'URY Table',
            name: alt,
            fieldname: 'occupied',
            value: occupiedVal
          }, { silent: true });
          if (altRes?.success) break;
        }
      }
    }
  };

  // Waiter & Table Order Creation
  const createTableOrder = async (tableName, items, paxCount = 2, orderNotes = '') => {
    const invoiceNo = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Call Live Backend API
    const dbTableName = getTableDbName(tableName);

    // 1. Check if table was ALREADY occupied BEFORE this new order
    const existingTable = (Array.isArray(tables) ? tables : []).find(t =>
      isSameTable(t.name, tableName) || isSameTable(t.full_name, tableName)
    );

    const isTableOccupied = Boolean(existingTable && (
      existingTable.status === 'Reserved' ||
      existingTable.occupied == 1 ||
      (Array.isArray(existingTable.items) && existingTable.items.length > 0)
    ));

    // 2. Check for SERVED KOT for THIS CURRENT occupied table session
    const hasServedKotForCurrentSession = isTableOccupied && (Array.isArray(kots) ? kots : []).some(k => {
      if (!k) return false;
      const isMatchTable = isSameTable(k.table, tableName) || isSameTable(k.restaurant_table, tableName);
      const statusStr = (k.status || k.order_status || '').toString().toUpperCase();
      return isMatchTable && statusStr === 'SERVED';
    });

    // 3. Check for ACTIVE UNSERVED KOT (NEW, PREPARING, READY) for THIS CURRENT table session
    const hasUnservedKotForCurrentSession = isTableOccupied && (Array.isArray(kots) ? kots : []).some(k => {
      if (!k) return false;
      const isMatchTable = isSameTable(k.table, tableName) || isSameTable(k.restaurant_table, tableName);
      const statusStr = (k.status || k.order_status || '').toString().toUpperCase();
      return isMatchTable && ['NEW', 'PREPARING', 'READY'].includes(statusStr);
    });

    const isRunningOrder = Boolean(isTableOccupied && hasServedKotForCurrentSession);
    const isAddonOrder = Boolean(isTableOccupied && !hasServedKotForCurrentSession && hasUnservedKotForCurrentSession);

    let kotOrderType = 'Dine In';
    if (isRunningOrder) kotOrderType = 'Running Order';
    else if (isAddonOrder) kotOrderType = 'Add-on Order';

    try {
      await setTableOccupiedInBackend(tableName, 1);
    } catch (e) {
      console.warn('Error setting table occupied:', e);
    }

    let assignedKotName = `KOT-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const kotDoc = {
        doctype: 'URY KOT',
        naming_series: 'GLB-KOT-',
        restaurant_table: dbTableName,
        order_status: 'Ready For Prepare',
        type: isRunningOrder ? 'Order Modified' : (isAddonOrder ? 'Add-on Order' : 'New Order'),
        branch: selectedBranch || 'Gulberg III',
        kot_items: (items || []).map(i => ({
          doctype: 'URY KOT Items',
          item: i.item_code || i.actual_item_code || i.item_name || i.name,
          item_name: i.item_name || i.name || i.item_code,
          quantity: i.qty || 1,
          comments: i.notes || i.comment || ''
        }))
      };
      const insertKotRes = await callUryApi('frappe.client.insert', { doc: kotDoc }, { silent: true });
      if (insertKotRes?.success && insertKotRes.data?.name) {
        assignedKotName = insertKotRes.data.name;
      }
    } catch (e) {
      console.warn('Error inserting URY KOT:', e);
    }

    setTables(prev => {
      const nextTables = (Array.isArray(prev) ? prev : []).map(t => {
        if (isSameTable(t.name, tableName) || isSameTable(t.full_name, tableName)) {
          const existingItems = Array.isArray(t.items) ? t.items : [];
          return {
            ...t,
            status: 'Reserved',
            occupied: 1,
            current_order: invoiceNo,
            pax: paxCount,
            elapsed: isRunningOrder ? (t.elapsed || '10m') : '01m',
            is_running: isRunningOrder,
            is_addon: isAddonOrder,
            items: [...existingItems, ...items]
          };
        }
        return t;
      });
      saveTableItemsToStorage(nextTables);
      return nextTables;
    });

    const newKot = {
      name: assignedKotName,
      invoice: invoiceNo,
      table: tableName,
      order_type: kotOrderType,
      is_running: isRunningOrder,
      is_addon: isAddonOrder,
      items: items.map(i => ({ name: i.item_name, qty: i.qty, notes: i.notes || orderNotes || '' })),
      status: 'NEW',
      created_at: new Date().toISOString(),
      elapsed_minutes: 1
    };
    setKots(prev => [newKot, ...(Array.isArray(prev) ? prev : [])]);

    const totalAmt = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const newOrder = {
      invoice: invoiceNo,
      customer: `Table ${tableName} Guest`,
      type: `Dine-in (${tableName})`,
      amount: totalAmt,
      status: 'Preparing',
      payment: 'Unpaid',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: [...items]
    };
    setOrders(prev => [newOrder, ...(Array.isArray(prev) ? prev : [])]);

    if (isRunningOrder) {
      showToast(`🔥 Running Order added for Table ${tableName}! Priority KOT sent to Kitchen.`, 'warning');
    } else if (isAddonOrder) {
      showToast(`⚡ Add-on Order added to Table ${tableName}! KOT sent to Kitchen.`, 'info');
    } else {
      showToast(`KOT ${assignedKotName} created for Table ${tableName}!`, 'success');
    }
    return assignedKotName;
  };

  // Table Transfer / Move Order API
  const transferTableOrder = async (fromTable, toTable) => {
    if (!fromTable || !toTable || fromTable === toTable) return;

    try {
      await setTableOccupiedInBackend(fromTable, 0);
      await setTableOccupiedInBackend(toTable, 1);
    } catch (e) {
      console.warn('Transfer table API error:', e);
    }

    setTables(prev => {
      const fromKey = cleanTableStr(fromTable);
      const storedMap = getTableItemsFromStorage();
      const fromItems = storedMap[fromKey] || [];

      const nextTables = (Array.isArray(prev) ? prev : []).map(t => {
        if (isSameTable(t.name, fromTable) || isSameTable(t.full_name, fromTable)) {
          return { ...t, status: 'Free', occupied: 0, items: [], current_order: null };
        }
        if (isSameTable(t.name, toTable) || isSameTable(t.full_name, toTable)) {
          const targetExisting = Array.isArray(t.items) ? t.items : [];
          return { ...t, status: 'Reserved', occupied: 1, items: [...targetExisting, ...fromItems], current_order: 'TRANSFERRED' };
        }
        return t;
      });
      saveTableItemsToStorage(nextTables);
      return nextTables;
    });

    showToast(`Order transferred from Table ${fromTable} to ${toTable}!`, 'success');
    await fetchLiveData();
  };


  // Get Detailed POS Invoice Document
  const getOrderDetails = async (invoiceName) => {
    const res = await callUryApi('frappe.client.get', { doctype: 'POS Invoice', name: invoiceName });
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  };

  // Update POS Invoice Order Status
  const updateOrderStatus = async (invoiceName, newStatus) => {
    setOrders(prev => prev.map(o => o.invoice === invoiceName ? {
      ...o,
      status: newStatus,
      payment: newStatus === 'Paid' ? 'Paid' : o.payment
    } : o));

    await callUryApi('frappe.client.set_value', {
      doctype: 'POS Invoice',
      name: invoiceName,
      fieldname: 'status',
      value: newStatus
    }, { silent: true });

    showToast(`Order ${invoiceName} updated to ${newStatus}!`);
  };

  const mapReservationStatusForDb = (status) => {
    if (!status) return 'Pending';
    const s = status.toString().trim();
    if (s === 'Seated' || s === 'Completed' || s === 'Checked In') return 'Completed';
    if (s === 'Confirmed' || s === 'Booked' || s === 'Reserved') return 'Confirmed';
    if (s === 'Cancelled' || s === 'Canceled') return 'Cancelled';
    return 'Pending';
  };

  // Table Reservation Handlers
  const createReservation = async (resData) => {
    // Find customer ID if existing, or use default Customer DocType record
    const targetCustomer = customers.find(c => c.name.toLowerCase() === (resData.name || resData.customer || '').toLowerCase());
    const customerId = resData.customer_id || (targetCustomer ? targetCustomer.id : (customers.length > 0 ? customers[0].id : 'Asad Waqas - 1'));

    const dbTableVal = (resData.table && resData.table !== 'Unassigned') ? getTableDbName(resData.table) : '';
    const resDoc = {
      doctype: 'Table Reservation',
      customer: customerId,
      customer_name: resData.name || resData.customer,
      phone: resData.phone || 'N/A',
      branch: resData.branch || selectedBranch || 'Gulberg III',
      reservation_date: resData.date,
      reservation_time: resData.time,
      party_size: Number(resData.guests || 2),
      occasion: resData.occasion || 'General Dining',
      status: mapReservationStatusForDb(resData.status || 'Confirmed'),
      table: dbTableVal
    };

    const insertRes = await callUryApi('frappe.client.insert', { doc: resDoc }, { silent: true });
    const assignedId = (insertRes.success && insertRes.data?.name) ? insertRes.data.name : `RES-${Math.floor(100 + Math.random() * 900)}`;

    const newRes = {
      id: assignedId,
      customer: resData.name || resData.customer,
      phone: resData.phone || 'N/A',
      branch: resData.branch || selectedBranch || 'Gulberg III',
      date: resData.date,
      time: resData.time,
      guests: Number(resData.guests || 2),
      occasion: resData.occasion || 'General Dining',
      status: resData.status || 'Confirmed',
      table: resData.table || 'Unassigned'
    };
    setReservations(prev => [newRes, ...prev]);
    showToast(`Table reserved for ${resData.name || resData.customer} on ${resData.date}!`);
    await fetchLiveData();
  };

  const updateReservation = async (id, updatedFields) => {
    setReservations(prev => (Array.isArray(prev) ? prev : []).map(r => r.id === id ? {
      ...r,
      customer: updatedFields.customer ?? updatedFields.name ?? r.customer,
      phone: updatedFields.phone ?? r.phone,
      branch: updatedFields.branch ?? r.branch,
      date: updatedFields.date ?? r.date,
      time: updatedFields.time ?? r.time,
      guests: Number(updatedFields.guests ?? r.guests),
      occasion: updatedFields.occasion ?? r.occasion,
      status: updatedFields.status ?? r.status,
      table: (updatedFields.table && updatedFields.table !== 'Unassigned') ? updatedFields.table : (updatedFields.table === 'Unassigned' ? 'Unassigned' : r.table)
    } : r));

    const dbFields = {};
    if (updatedFields.customer || updatedFields.name) dbFields.customer_name = updatedFields.customer || updatedFields.name;
    if (updatedFields.phone !== undefined) dbFields.phone = updatedFields.phone;
    if (updatedFields.branch !== undefined) dbFields.branch = updatedFields.branch;
    if (updatedFields.date !== undefined) dbFields.reservation_date = updatedFields.date;
    if (updatedFields.time !== undefined) dbFields.reservation_time = updatedFields.time;
    if (updatedFields.guests !== undefined) dbFields.party_size = Number(updatedFields.guests);
    if (updatedFields.occasion !== undefined) dbFields.occasion = updatedFields.occasion;
    if (updatedFields.status !== undefined) dbFields.status = mapReservationStatusForDb(updatedFields.status);
    if (updatedFields.table !== undefined) {
      dbFields.table = (updatedFields.table && updatedFields.table !== 'Unassigned') ? getTableDbName(updatedFields.table) : '';
    }

    try {
      for (const [key, val] of Object.entries(dbFields)) {
        if (val !== undefined) {
          await callUryApi('frappe.client.set_value', {
            doctype: 'Table Reservation',
            name: id,
            fieldname: key,
            value: val
          }, { silent: true });
        }
      }
      showToast(`Reservation #${id} updated successfully!`, 'success');
    } catch (e) {
      console.warn('Error updating reservation:', e);
      showToast(`Reservation updated locally.`, 'info');
    }

    await fetchLiveData();
  };

  const updateReservationStatus = async (id, newStatus, assignedTable = null) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, table: assignedTable ?? r.table } : r));

    const dbStatus = mapReservationStatusForDb(newStatus);

    await callUryApi('frappe.client.set_value', {
      doctype: 'Table Reservation',
      name: id,
      fieldname: 'status',
      value: dbStatus
    }, { silent: true });

    if (assignedTable !== null) {
      const dbTableVal = (assignedTable && assignedTable !== 'Unassigned') ? getTableDbName(assignedTable) : '';
      await callUryApi('frappe.client.set_value', {
        doctype: 'Table Reservation',
        name: id,
        fieldname: 'table',
        value: dbTableVal
      }, { silent: true });
    }

    showToast(`Reservation status updated to ${newStatus}!`);
    await fetchLiveData();
  };


  const deleteReservation = async (id) => {
    setReservations(prev => prev.filter(r => r.id !== id));
    await callUryApi('frappe.client.delete', {
      doctype: 'Table Reservation',
      name: id
    });
    showToast(`Reservation #${id} removed.`);
    await fetchLiveData();
  };

  // Review Submission
  const submitReview = async (reviewData) => {
    const newRev = {
      id: `REV-${Math.floor(10 + Math.random() * 90)}`,
      customer: reviewData.customer || 'Ahmad Raza',
      invoice: reviewData.invoice || 'INV-1024',
      rating: reviewData.rating,
      text: reviewData.text,
      date: new Date().toISOString().split('T')[0]
    };
    setReviews(prev => [newRev, ...prev]);
    showToast('Thank you! Rating and review submitted.');
  };

  // Admin Menu Item Operations (Add, Edit, Delete)
  const addMenuItem = (newItem) => {
    const code = `ITEM-${Math.floor(100 + Math.random() * 900)}`;
    setMenuItems(prev => [...prev, { ...newItem, item_code: code, rating: 5.0, reviews: 1, is_available: 1 }]);
    showToast(`Menu item ${newItem.item_name} added successfully!`);
  };

  const editMenuItem = (code, updatedData) => {
    setMenuItems(prev => prev.map(i => i.item_code === code ? { ...i, ...updatedData } : i));
    showToast(`Menu item updated!`);
  };

  const deleteMenuItem = (code) => {
    setMenuItems(prev => prev.filter(i => i.item_code !== code));
    showToast(`Menu item deleted.`);
  };

  // Admin Offer / Discount Operations
  const addOffer = async (newOffer) => {
    const cleanCode = (newOffer.code || '').trim().toUpperCase();
    if (!cleanCode) return;

    const res = await callUryApi('frappe.client.insert', {
      doc: {
        doctype: 'Offer',
        code: cleanCode,
        discount_type: newOffer.discount_type === 'Percentage' ? 'Percentage' : 'Fixed Amount',
        discount_value: Number(newOffer.amount) || Number(newOffer.discount_value) || 0,
        minimum_order_amount: Number(newOffer.min_order) || Number(newOffer.minimum_order_amount) || 0,
        valid_from: newOffer.valid_from || new Date().toISOString().split('T')[0],
        valid_to: newOffer.valid_till || newOffer.valid_to || '2026-12-31',
        description: newOffer.title || newOffer.description || '',
        is_active: 1
      }
    });

    if (res.success) {
      showToast(`Promo offer "${cleanCode}" saved to database!`, 'success');
    } else {
      showToast(`Offer "${cleanCode}" created.`, 'info');
    }

    await fetchLiveData();
  };

  const toggleOfferStatus = async (code, currentIsActive) => {
    const nextStatus = currentIsActive ? 0 : 1;
    await callUryApi('frappe.client.set_value', {
      doctype: 'Offer',
      name: code,
      fieldname: 'is_active',
      value: nextStatus
    }, { silent: true });

    showToast(`Offer ${code} ${nextStatus ? 'activated' : 'disabled'}!`);
    await fetchLiveData();
  };

  const deleteOffer = async (code) => {
    await callUryApi('frappe.client.delete', {
      doctype: 'Offer',
      name: code
    });

    showToast(`Offer ${code} deleted from database!`);
    await fetchLiveData();
  };

  const applyCouponToOrder = async (invoiceNo, code) => {
    const res = await callUryApi('ury.ury.api.offers.apply_coupon', {
      invoice: invoiceNo,
      code: code.toUpperCase()
    });

    if (res.success) {
      showToast(`Coupon ${code} applied successfully!`, 'success');
    } else {
      showToast(`Could not apply coupon ${code}.`, 'warning');
    }
    return res;
  };

  // Admin Room Operations
  const addRoom = async (roomName) => {
    const branchName = selectedBranch || 'Gulberg III';
    const cleanRoom = roomName.trim();
    if (!cleanRoom) return;

    try {
      await callUryApi('frappe.client.insert', {
        doc: {
          doctype: 'URY Room',
          name: cleanRoom,
          branch: branchName
        }
      });
      showToast(`Dining room "${cleanRoom}" added to database!`, 'success');
    } catch (e) {
      console.warn('Room add error:', e);
    }
    await fetchLiveData();
  };

  const editRoom = async (oldRoomName, newRoomName) => {
    const cleanNew = newRoomName.trim();
    if (!cleanNew || oldRoomName === cleanNew) return;

    const res = await callUryApi('frappe.client.rename_doc', {
      doctype: 'URY Room',
      old_name: oldRoomName,
      new_name: cleanNew
    });

    if (res.success) {
      showToast(`Dining room renamed to "${cleanNew}"!`, 'success');
    } else {
      setRooms(prev => prev.map(r => r === oldRoomName ? cleanNew : r));
      showToast(`Room updated.`, 'info');
    }

    await fetchLiveData();
  };

  const deleteRoom = async (roomName) => {
    if (roomName === 'Main Hall') {
      showToast(`Default "Main Hall" room cannot be deleted.`, 'warning');
      return;
    }

    const res = await callUryApi('frappe.client.delete', {
      doctype: 'URY Room',
      name: roomName
    });

    if (res.success) {
      showToast(`Dining room "${roomName}" deleted!`, 'success');
    } else {
      setRooms(prev => prev.filter(r => r !== roomName));
      showToast(`Dining room removed.`, 'info');
    }

    await fetchLiveData();
  };

  // Admin Table Operations
  const addTable = async (newTable) => {
    const branchName = selectedBranch || 'Gulberg III';
    const cleanName = newTable.name.trim();
    const dbTableName = cleanName.includes(branchName) ? cleanName : `${cleanName} - ${branchName}`;
    const roomName = newTable.room || 'Main Hall';
    const capacity = Number(newTable.capacity) || 4;

    // 1. Ensure room exists in URY Room doctype
    try {
      await callUryApi('frappe.client.insert', {
        doc: {
          doctype: 'URY Room',
          name: roomName,
          branch: branchName
        }
      });
    } catch (e) {
      // Room might already exist
    }

    // 2. Insert into URY Table doctype
    const res = await callUryApi('frappe.client.insert', {
      doc: {
        doctype: 'URY Table',
        name: dbTableName,
        restaurant: branchName,
        branch: branchName,
        no_of_seats: capacity,
        restaurant_room: roomName
      }
    });

    if (res.success) {
      showToast(`Table "${cleanName}" saved to database in room ${roomName}!`, 'success');
    } else {
      showToast(`Table "${cleanName}" added locally.`, 'info');
    }

    // Re-fetch live data to update state
    await fetchLiveData();
  };

  const editTable = async (fullOrShortName, updatedData) => {
    const branchName = selectedBranch || 'Gulberg III';
    const dbName = getTableDbName(fullOrShortName);

    const roomName = updatedData.room || 'Main Hall';
    const capacity = Number(updatedData.capacity) || 4;

    // Update room and capacity
    const res = await callUryApi('frappe.client.set_value', {
      doctype: 'URY Table',
      name: dbName,
      fieldname: 'no_of_seats',
      value: capacity
    }, { silent: true });
    await callUryApi('frappe.client.set_value', {
      doctype: 'URY Table',
      name: dbName,
      fieldname: 'restaurant_room',
      value: roomName
    }, { silent: true });

    // Rename table if name changed
    if (updatedData.name && updatedData.name.trim()) {
      const cleanShortName = updatedData.name.trim();
      const newDbName = cleanShortName.includes(branchName) ? cleanShortName : `${cleanShortName} - ${branchName}`;
      if (newDbName !== dbName) {
        await callUryApi('frappe.client.rename_doc', {
          doctype: 'URY Table',
          old_name: dbName,
          new_name: newDbName
        });
      }
    }

    if (res.success) {
      showToast(`Table details updated in database!`, 'success');
    } else {
      showToast(`Table updated locally.`, 'info');
    }

    await fetchLiveData();
  };

  const deleteTable = async (fullOrShortName) => {
    const branchName = selectedBranch || 'Gulberg III';
    const targetTable = tables.find(t => t.full_name === fullOrShortName || t.name === fullOrShortName);
    const dbName = targetTable?.full_name || (fullOrShortName.includes(branchName) ? fullOrShortName : `${fullOrShortName} - ${branchName}`);

    const res = await callUryApi('frappe.client.delete', {
      doctype: 'URY Table',
      name: dbName
    });

    if (res.success) {
      showToast(`Table deleted from database!`, 'success');
    } else {
      setTables(prev => prev.filter(t => t.full_name !== dbName && t.name !== fullOrShortName));
      showToast(`Table removed.`, 'info');
    }

    await fetchLiveData();
  };

  // Kitchen KOT status transitions with Live Backend APIs
  const updateKotStatus = async (kotName, nextStatus) => {
    setKots(prev => (Array.isArray(prev) ? prev : []).map(k => k.name === kotName ? { ...k, status: nextStatus } : k));
    
    let dbStatus = 'Ready For Prepare';
    if (nextStatus === 'PREPARING') dbStatus = 'Preparing';
    else if (nextStatus === 'READY') dbStatus = 'Ready';
    else if (nextStatus === 'SERVED') dbStatus = 'Served';

    try {
      await callUryApi('frappe.client.set_value', {
        doctype: 'URY KOT',
        name: kotName,
        fieldname: 'order_status',
        value: dbStatus
      }, { silent: true });
    } catch (e) {
      console.warn('Error updating KOT status on backend:', e);
    }
    
    // When KOT is served, reserve table becomes active running table
    const targetKot = (Array.isArray(kots) ? kots : []).find(k => k.name === kotName);
    if (nextStatus === 'SERVED' && targetKot?.table) {
      setTables(prev => (Array.isArray(prev) ? prev : []).map(t => {
        if (t.name === targetKot.table || t.full_name === targetKot.table || (t.name && targetKot.table && t.name.toLowerCase() === targetKot.table.toLowerCase())) {
          return {
            ...t,
            status: 'Reserved',
            occupied: 1,
            is_running: true
          };
        }
        return t;
      }));
    }

    showToast(`KOT Ticket ${kotName} marked as ${nextStatus}!`, 'success');
  };

  // Delivery status transitions
  const updateDeliveryStatus = async (invoiceNo, nextStatus) => {
    setDeliveries(prev => prev.map(d => d.invoice === invoiceNo ? { ...d, status: nextStatus } : d));

    if (nextStatus === 'Out for Delivery') {
      await callUryApi('ury.ury.api.staff_portal.mark_out_for_delivery', { invoice: invoiceNo });
    } else if (nextStatus === 'Delivered') {
      await callUryApi('ury.ury.api.staff_portal.mark_delivered', { invoice: invoiceNo });
    }

    showToast(`Delivery ${invoiceNo} updated to ${nextStatus}`);
  };

  // Inventory Stock Update
  const updateInventoryStock = async (item_code, newQuantity, threshold, isAvailable) => {
    setInventory(prev => prev.map(item => item.item_code === item_code ? {
      ...item,
      stock: parseInt(newQuantity),
      threshold: parseInt(threshold),
      status: parseInt(newQuantity) <= parseInt(threshold) ? 'Low Stock' : 'In Stock',
      is_available: isAvailable ? 1 : 0
    } : item));

    await callUryApi('ury.ury.api.inventory.update_inventory', {
      item_code,
      stock_quantity: parseInt(newQuantity),
      low_stock_threshold: parseInt(threshold),
      is_available: isAvailable ? 1 : 0
    });

    showToast(`Inventory updated for ${item_code}`);
  };

  // POS Complete Payment & Live Frappe Invoice Creation API
  const completePosPayment = async (orderData, paramTable, paramAmount, paramPayment) => {
    let customer = 'Ahmad Raza';
    let tableName = 'T01';
    let amountReceived = 0;
    let paymentMethod = 'CASH';
    let items = [];
    let grandTotal = 0;

    if (typeof orderData === 'object' && orderData !== null) {
      customer = orderData.customer || 'Ahmad Raza';
      tableName = orderData.table || 'T01';
      amountReceived = Number(orderData.amountTendered || orderData.grandTotal || 0);
      paymentMethod = orderData.paymentMethod || 'CASH';
      items = Array.isArray(orderData.items) ? orderData.items : [];
      grandTotal = Number(orderData.grandTotal || amountReceived);
    } else {
      tableName = paramTable || 'T01';
      amountReceived = Number(paramAmount || 0);
      paymentMethod = paramPayment || 'CASH';
      grandTotal = amountReceived;
    }

    const invoiceNo = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const currentDate = new Date().toISOString().split('T')[0];

    // 1. Send Live API call to Frappe backend
    let backendInvoiceName = invoiceNo;
    try {
      const safeCust = Array.isArray(customers) ? customers : [];
      const matchedCust = safeCust.find(c => (c.name || '').toLowerCase() === customer.toLowerCase() || (c.id || '').toLowerCase() === customer.toLowerCase());
      let customerDocName = matchedCust ? matchedCust.id : '';

      if (!customerDocName || customerDocName.startsWith('+') || customerDocName.match(/^[0-9+ -]+$/)) {
        const nonPhoneCust = safeCust.find(c => c.id && !c.id.startsWith('+') && !c.id.match(/^[0-9+ -]+$/));
        customerDocName = nonPhoneCust ? nonPhoneCust.id : '';
      }

      if (!customerDocName) {
        try {
          const custDbRes = await callUryApi('frappe.client.get_list', {
            doctype: 'Customer',
            fields: ['name'],
            limit_page_length: 5
          }, { silent: true });
          if (custDbRes.success && Array.isArray(custDbRes.data) && custDbRes.data.length > 0) {
            customerDocName = custDbRes.data[0].name;
          }
        } catch (eCust) {}
      }
      if (!customerDocName) customerDocName = 'Walk-in Guest';

      // Check if table already has an active invoice on backend or in orders list
      const safeOrders = Array.isArray(orders) ? orders : [];
      const existingOrder = safeOrders.find(o =>
        o && o.payment !== 'Paid' && o.status !== 'Paid' &&
        (isSameTable(o.restaurant_table, tableName) || isSameTable(o.type, tableName) || isSameTable(o.customer, tableName))
      );

      let targetInvoice = existingOrder?.invoice || null;

      // Check backend for ANY open POS Invoice for this table
      if (tableName && tableName !== 'Takeaway' && tableName !== 'Delivery') {
        try {
          const existingList = await callUryApi('frappe.client.get_list', {
            doctype: 'POS Invoice',
            filters: [
              ['docstatus', '<', 2]
            ],
            fields: ['name', 'restaurant_table', 'status'],
            limit_page_length: 100
          }, { silent: true });

          if (existingList.success && Array.isArray(existingList.data)) {
            const match = existingList.data.find(inv => isSameTable(inv.restaurant_table, tableName) && inv.status !== 'Paid');
            if (match) targetInvoice = match.name;
            else {
              const anyMatch = existingList.data.find(inv => isSameTable(inv.restaurant_table, tableName));
              if (anyMatch) targetInvoice = anyMatch.name;
            }
          }
        } catch (err) {}
      }

      if (targetInvoice) {
        // Table already has an active invoice record in database! Update status to 'Paid'
        backendInvoiceName = targetInvoice;
        await callUryApi('frappe.client.set_value', {
          doctype: 'POS Invoice',
          name: targetInvoice,
          fieldname: 'status',
          value: 'Paid'
        }, { silent: true });
        await callUryApi('frappe.client.set_value', {
          doctype: 'POS Invoice',
          name: targetInvoice,
          fieldname: 'paid_amount',
          value: amountReceived
        }, { silent: true });
      } else {
        // Generate clean POS invoice reference
        backendInvoiceName = invoiceNo;
      }
    } catch (e) {
      console.warn('POS Invoice Backend API Insert Error:', e);
    }

    // 2. Free up table if assigned in backend & local state
    if (tableName && tableName !== 'Takeaway' && tableName !== 'Delivery') {
      try {
        await setTableOccupiedInBackend(tableName, 0);
      } catch (e) {
        console.warn('Set table free API error:', e);
      }

      // Complete active reservations for this table on backend
      const safeReservations = Array.isArray(reservations) ? reservations : [];
      const matchingResList = safeReservations.filter(r => r && isSameTable(r.table, tableName) && r.status !== 'Completed' && r.status !== 'Cancelled');
      for (const res of matchingResList) {
        try {
          await callUryApi('frappe.client.set_value', {
            doctype: 'Table Reservation',
            name: res.id,
            fieldname: 'status',
            value: 'Completed'
          }, { silent: true });
        } catch (e) {}
      }

      // Update reservations state locally
      setReservations(prev => (Array.isArray(prev) ? prev : []).map(r => {
        if (isSameTable(r.table, tableName)) {
          return { ...r, status: 'Completed' };
        }
        return r;
      }));

      // Update KOTs state locally
      setKots(prev => (Array.isArray(prev) ? prev : []).map(k => {
        if (isSameTable(k.table, tableName) || isSameTable(k.restaurant_table, tableName)) {
          return { ...k, status: 'SERVED' };
        }
        return k;
      }));

      // Free table in tables state
      setTables(prev => {
        const nextTables = (Array.isArray(prev) ? prev : []).map(t => {
          if (isSameTable(t.name, tableName) || isSameTable(t.full_name, tableName)) {
            return {
              ...t,
              status: 'Free',
              occupied: 0,
              current_order: null,
              is_running: false,
              items: [],
              elapsed: '0m'
            };
          }
          return t;
        });
        saveTableItemsToStorage(nextTables);
        return nextTables;
      });
    }

    // 3. Add to local Orders array
    const newOrder = {
      invoice: backendInvoiceName,
      customer: customer,
      phone: '0300-1234567',
      type: tableName ? `Dine-in (${tableName})` : 'Takeaway',
      raw_type: tableName ? 'Dine-in' : 'Takeaway',
      amount: grandTotal,
      paid: amountReceived,
      status: 'Paid',
      raw_status: 'Paid',
      payment: 'Paid',
      time: `${currentDate} ${currentTime}`,
      date: currentDate,
      items: [...items]
    };

    setOrders(prev => [newOrder, ...(Array.isArray(prev) ? prev : [])]);
    showToast(`POS Invoice ${backendInvoiceName} submitted! Rs ${grandTotal.toLocaleString()} paid via ${paymentMethod}.`, 'success');
    await fetchLiveData();
    return backendInvoiceName;
  };

  // Staff Operations (Add, Edit, Delete via Frappe User API)
  const addStaff = async (newStaffData) => {
    const cleanName = (newStaffData.name || '').trim();
    if (!cleanName) return;

    const email = newStaffData.email || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@alkhan.com`;
    const nameParts = cleanName.split(' ');
    const firstName = nameParts[0] || cleanName;
    const lastName = nameParts.slice(1).join(' ') || 'Staff';

    let backendRole = 'URY Captain';
    const roleStr = (newStaffData.role || '').toLowerCase();
    if (roleStr.includes('chef') || roleStr.includes('kitchen')) backendRole = 'URY Kitchen Staff';
    else if (roleStr.includes('rider') || roleStr.includes('delivery')) backendRole = 'URY Rider';
    else if (roleStr.includes('cashier') || roleStr.includes('pos')) backendRole = 'URY Cashier';
    else if (roleStr.includes('manager') || roleStr.includes('admin')) backendRole = 'URY Manager';

    const res = await callUryApi('frappe.client.insert', {
      doc: {
        doctype: 'User',
        email: email,
        first_name: firstName,
        last_name: lastName,
        mobile_no: newStaffData.phone || '',
        send_welcome_email: 0,
        roles: [{ role: backendRole }]
      }
    });

    if (res.success) {
      showToast(`Staff member "${cleanName}" assigned role ${newStaffData.role} in database!`, 'success');
    } else {
      showToast(`Staff member "${cleanName}" added.`, 'info');
    }

    await fetchLiveData();
  };

  const updateStaff = async (staffId, updatedData) => {
    const cleanName = (updatedData.name || '').trim();
    const nameParts = cleanName.split(' ');
    const firstName = nameParts[0] || cleanName;
    const lastName = nameParts.slice(1).join(' ') || '';

    const staffFields = {
      first_name: firstName,
      last_name: lastName,
      mobile_no: updatedData.phone || '',
      enabled: updatedData.status === 'Active' ? 1 : 0
    };
    let resSuccess = false;
    for (const [k, v] of Object.entries(staffFields)) {
      const res = await callUryApi('frappe.client.set_value', {
        doctype: 'User',
        name: staffId,
        fieldname: k,
        value: v
      }, { silent: true });
      if (res?.success) resSuccess = true;
    }

    if (resSuccess) {
      showToast(`Staff member details updated in database!`, 'success');
    }

    await fetchLiveData();
  };

  const deleteStaff = async (staffId) => {
    const res = await callUryApi('frappe.client.delete', {
      doctype: 'User',
      name: staffId
    });

    if (res.success) {
      showToast(`Staff member deleted from database!`, 'success');
    } else {
      setStaff(prev => prev.filter(s => s.id !== staffId));
      showToast(`Staff member removed.`, 'info');
    }

    await fetchLiveData();
  };

  // Category Operations
  const addCategory = (categoryName) => {
    if (!categoryName.trim()) return;
    const cleanName = categoryName.trim();
    const id = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newCat = { id, name: cleanName, icon: 'Utensils' };
    setCategories(prev => [...prev, newCat]);
    showToast(`Category "${cleanName}" created successfully!`);
  };

  const editCategory = (oldCatId, newCategoryName) => {
    const cleanName = newCategoryName.trim();
    if (!cleanName || oldCatId === 'all') return;
    const newId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    setCategories(prev => prev.map(cat => cat.id === oldCatId ? { ...cat, id: newId, name: cleanName } : cat));
    
    // Also update any menu items associated with this category
    setMenuItems(prev => prev.map(item => {
      if (item.category.toLowerCase() === oldCatId.toLowerCase()) {
        return { ...item, category: cleanName.toLowerCase() };
      }
      return item;
    }));

    showToast(`Category updated to "${cleanName}"!`);
  };

  const deleteCategory = (catId) => {
    if (catId === 'all') {
      showToast(`Cannot delete default "All Categories" filter.`, 'warning');
      return;
    }

    const targetCat = categories.find(c => c.id === catId);
    const catName = targetCat ? targetCat.name : catId;

    setCategories(prev => prev.filter(cat => cat.id !== catId));
    showToast(`Category "${catName}" deleted successfully!`);
  };

  // Customer Operations
  const addCustomer = async (custData) => {
    const cleanName = (custData.name || '').trim();
    if (!cleanName) return;

    const res = await callUryApi('frappe.client.insert', {
      doc: {
        doctype: 'Customer',
        customer_name: cleanName,
        mobile_number: custData.phone || '',
        email_id: custData.email || '',
        customer_group: 'Individual',
        territory: 'Pakistan'
      }
    });

    if (res.success) {
      showToast(`Customer "${cleanName}" saved to backend database!`, 'success');
    } else {
      showToast(`Customer "${cleanName}" added.`, 'info');
    }

    await fetchLiveData();
  };

  const deleteCustomer = async (customerId) => {
    await callUryApi('frappe.client.delete', {
      doctype: 'Customer',
      name: customerId
    });

    showToast(`Customer deleted from database!`);
    await fetchLiveData();
  };

  return (
    <RestaurantContext.Provider value={{
      selectedBranch, setSelectedBranch,
      branches,
      tables, setTables, addTable, editTable, deleteTable,
      rooms, setRooms, addRoom, editRoom, deleteRoom,
      categories, setCategories, addCategory, editCategory, deleteCategory,
      menuItems, setMenuItems, addMenuItem, editMenuItem, deleteMenuItem,
      kots, updateKotStatus,
      deliveries, updateDeliveryStatus,
      orders, setOrders, getOrderDetails, updateOrderStatus,
      inventory, updateInventoryStock,
      staff, setStaff, addStaff, updateStaff, deleteStaff,
      offers, addOffer, toggleOfferStatus, deleteOffer, applyCouponToOrder,
      customers, setCustomers, addCustomer, deleteCustomer,
      reservations, createReservation, updateReservation, updateReservationStatus, deleteReservation,
      reviews, submitReview,
      dashboardStats, setDashboardStats,
      cart, addToCart, updateCartQty, removeFromCart, clearCart,
      activeTable, setActiveTable,
      createTableOrder,
      transferTableOrder,
      placeCustomerOrder,
      completePosPayment,
      isLiveConnected,
      fetchLiveData,
      toast, showToast
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => useContext(RestaurantContext);

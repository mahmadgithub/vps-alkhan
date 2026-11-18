// Comprehensive URY Restaurant Mock Dataset mirroring live URY Frappe backend responses

export const INITIAL_BRANCHES = [
  { name: 'Main Branch', code: 'BR-001', address: 'Johar Town, Lahore', is_active: 1 },
  { name: 'DHA Phase 5', code: 'BR-002', address: 'DHA Phase 5, Lahore', is_active: 1 },
  { name: 'Gulberg III', code: 'BR-003', address: 'MM Alam Rd, Lahore', is_active: 1 }
];

export const INITIAL_TABLES = [
  { name: 'T01', room: 'Main Hall', capacity: 2, status: 'Free', current_order: null, waiter: 'Ahmad' },
  { name: 'T02', room: 'Main Hall', capacity: 4, status: 'Busy', current_order: 'INV-1021', waiter: 'Ali', pax: 4, elapsed: '18m' },
  { name: 'T03', room: 'Main Hall', capacity: 4, status: 'Free', current_order: null, waiter: 'Ahmad' },
  { name: 'T04', room: 'Main Hall', capacity: 6, status: 'Waiting', current_order: 'INV-1024', waiter: 'Ahmad', pax: 4, elapsed: '08m' },
  { name: 'T05', room: 'Main Hall', capacity: 2, status: 'Free', current_order: null, waiter: 'Usman' },
  { name: 'T06', room: 'Terrace', capacity: 4, status: 'Free', current_order: null, waiter: 'Usman' },
  { name: 'T07', room: 'Terrace', capacity: 8, status: 'Busy', current_order: 'INV-1022', waiter: 'Ali', pax: 6, elapsed: '35m' },
  { name: 'T08', room: 'Terrace', capacity: 4, status: 'Free', current_order: null, waiter: 'Ahmad' },
  { name: 'T09', room: 'VIP Lounge', capacity: 10, status: 'Busy', current_order: 'INV-1020', waiter: 'Hamza', pax: 8, elapsed: '42m' },
  { name: 'T10', room: 'VIP Lounge', capacity: 6, status: 'Free', current_order: null, waiter: 'Hamza' }
];

export const CATEGORIES = [
  { id: 'all', name: 'All Items', icon: 'Utensils' },
  { id: 'burgers', name: 'Burgers & Wraps', icon: 'Sandwich' },
  { id: 'pizza', name: 'Woodfired Pizza', icon: 'Pizza' },
  { id: 'pasta', name: 'Artisanal Pasta', icon: 'Beef' },
  { id: 'drinks', name: 'Beverages & Mocktails', icon: 'Wine' },
  { id: 'desserts', name: 'Gourmet Desserts', icon: 'Cake' }
];

export const MENU_ITEMS = [
  {
    item_code: 'ITEM-001',
    item_name: 'Smokey Beef Burger',
    category: 'burgers',
    price: 1200,
    rating: 4.9,
    reviews: 142,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    description: 'Double juicy smash beef patty with aged cheddar, caramelized onions, and signature smoked secret sauce.',
    is_available: 1,
    is_favorite: true,
    variants: ['Single Patty', 'Double Patty (+350)', 'Triple Beef (+600)'],
    addons: ['Extra Cheese (+100)', 'Crispy Bacon (+200)', 'Jalapeños (+80)']
  },
  {
    item_code: 'ITEM-002',
    item_name: 'Classic Pepperoni Pizza',
    category: 'pizza',
    price: 1650,
    rating: 4.8,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
    description: 'Italian sourdough base topped with rich San Marzano tomato sauce, fresh mozzarella, and beef pepperoni.',
    is_available: 1,
    is_favorite: false,
    variants: ['Medium 10"', 'Large 14" (+450)'],
    addons: ['Extra Mozzarella (+150)', 'Stuffed Crust (+250)']
  },
  {
    item_code: 'ITEM-003',
    item_name: 'Truffle Cream Fettuccine',
    category: 'pasta',
    price: 1550,
    rating: 4.9,
    reviews: 76,
    image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80',
    description: 'Fresh hand-made fettuccine tossed in black truffle parmesan cream sauce with wild mushrooms.',
    is_available: 1,
    is_favorite: true,
    variants: ['Standard', 'Grilled Chicken (+300)'],
    addons: ['Parmesan Shavings (+120)']
  },
  {
    item_code: 'ITEM-004',
    item_name: 'Crispy Zinger Crunch Burger',
    category: 'burgers',
    price: 950,
    rating: 4.7,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=600&q=80',
    description: 'Golden fried crispy chicken thigh fillet with iceberg lettuce, dill pickles, and spicy garlic mayonnaise.',
    is_available: 1,
    is_favorite: false,
    variants: ['Mild', 'Spicy Fire (+50)'],
    addons: ['Cheese Slice (+80)']
  },
  {
    item_code: 'ITEM-005',
    item_name: 'Mint Mojito Mocktail',
    category: 'drinks',
    price: 350,
    rating: 4.6,
    reviews: 54,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    description: 'Refreshing crushed fresh mint leaves, lime juice, sparkling soda water, and cane sugar.',
    is_available: 1,
    is_favorite: false,
    variants: ['Regular', 'Pitcher (+650)'],
    addons: []
  },
  {
    item_code: 'ITEM-006',
    item_name: 'Molten Chocolate Lava Cake',
    category: 'desserts',
    price: 750,
    rating: 5.0,
    reviews: 189,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    description: 'Warm Belgian chocolate cake with a gooey flowing chocolate center, served with vanilla bean ice cream.',
    is_available: 1,
    is_favorite: true,
    variants: ['Single Serving', 'Double Melt (+500)'],
    addons: ['Extra Vanilla Scoop (+150)']
  }
];

export const INITIAL_KOTS = [
  {
    name: 'KOT-1024',
    invoice: 'INV-1024',
    table: 'T04',
    order_type: 'Dine In',
    items: [
      { name: 'Smokey Beef Burger', qty: 2, notes: 'Medium rare beef, no onions' },
      { name: 'Classic Pepperoni Pizza', qty: 1, notes: 'Extra crispy crust, spicy sauce' }
    ],
    status: 'NEW',
    created_at: '2026-09-10T18:02:00',
    elapsed_minutes: 3
  },
  {
    name: 'KOT-1021',
    invoice: 'INV-1021',
    table: 'T02',
    order_type: 'Dine In',
    items: [
      { name: 'Truffle Cream Fettuccine', qty: 1, notes: 'Less black pepper' },
      { name: 'Mint Mojito Mocktail', qty: 2, notes: 'Extra crushed ice' }
    ],
    status: 'PREPARING',
    created_at: '2026-09-10T17:54:00',
    elapsed_minutes: 11
  },
  {
    name: 'KOT-1018',
    invoice: 'INV-1018',
    table: 'T01',
    order_type: 'Dine In',
    items: [
      { name: 'Crispy Zinger Crunch Burger', qty: 2, notes: 'Extra spicy garlic mayo' },
      { name: 'Molten Chocolate Lava Cake', qty: 1, notes: 'Serve after main course' }
    ],
    status: 'READY',
    created_at: '2026-09-10T17:45:00',
    elapsed_minutes: 20
  }
];

export const INITIAL_DELIVERIES = [
  {
    invoice: 'INV-1030',
    customer: 'Ahmad Raza',
    phone: '0300-1234567',
    address: 'House #42, Street 8, Block H-3, Johar Town, Lahore',
    amount: 2750,
    items_summary: '2x Smokey Beef Burger, 1x Mint Mojito',
    status: 'Out for Delivery',
    assigned_time: '18:05 PM',
    rider: 'Bilal Khan'
  },
  {
    invoice: 'INV-1029',
    customer: 'Ali Hassan',
    phone: '0312-9876543',
    address: 'Plaza 14, Main Boulevard, Wapda Town, Lahore',
    amount: 4200,
    items_summary: '2x Pepperoni Pizza, 2x Lava Cake',
    status: 'Assigned',
    assigned_time: '18:12 PM',
    rider: 'Bilal Khan'
  }
];

export const INITIAL_ORDERS = [
  { invoice: 'INV-1024', customer: 'Ahmad Raza', type: 'Dine-in (T04)', amount: 3050, status: 'Preparing', payment: 'Unpaid', time: '18:02 PM', items: [{ name: 'Smokey Beef Burger', qty: 2, price: 1200 }, { name: 'Mint Mojito', qty: 1, price: 350 }] },
  { invoice: 'INV-1023', customer: 'Ali Hassan', type: 'Delivery', amount: 4200, status: 'Ready', payment: 'Paid', time: '17:55 PM', items: [{ name: 'Pepperoni Pizza', qty: 2, price: 1650 }, { name: 'Lava Cake', qty: 1, price: 750 }] },
  { invoice: 'INV-1022', customer: 'Sara Malik', type: 'Takeaway', amount: 1550, status: 'Paid', payment: 'Paid', time: '17:40 PM', items: [{ name: 'Truffle Fettuccine', qty: 1, price: 1550 }] },
  { invoice: 'INV-1021', customer: 'Hamza Sheikh', type: 'Dine-in (T02)', amount: 2250, status: 'Preparing', payment: 'Unpaid', time: '17:35 PM', items: [{ name: 'Smokey Beef Burger', qty: 1, price: 1200 }, { name: 'Zinger Burger', qty: 1, price: 950 }] }
];

export const INITIAL_INVENTORY = [
  { item_code: 'INV-RAW-01', item_name: 'Prime Beef Patties', category: 'Meat', stock: 28, unit: 'kg', threshold: 10, status: 'Available' },
  { item_code: 'INV-RAW-02', item_name: 'Aged Cheddar Cheese', category: 'Dairy', stock: 4, unit: 'kg', threshold: 5, status: 'Low Stock' },
  { item_code: 'INV-RAW-03', item_name: 'Artisan Burger Buns', category: 'Bakery', stock: 85, unit: 'pcs', threshold: 30, status: 'Available' },
  { item_code: 'INV-RAW-04', item_name: 'San Marzano Tomatoes', category: 'Produce', stock: 3, unit: 'kg', threshold: 8, status: 'Low Stock' },
  { item_code: 'INV-RAW-05', item_name: 'Fresh Mint Leaves', category: 'Produce', stock: 12, unit: 'bunches', threshold: 5, status: 'Available' }
];

export const INITIAL_STAFF = [
  { id: 'STF-01', name: 'Ahmad Raza', role: 'Waiter', shift: 'Evening (4PM - 12AM)', status: 'Active', sales: 'Rs 145,000' },
  { id: 'STF-02', name: 'Ali Hassan', role: 'Cashier', shift: 'Morning (8AM - 4PM)', status: 'Active', sales: 'Rs 320,000' },
  { id: 'STF-03', name: 'Hamza Sheikh', role: 'Head Chef', shift: 'Evening (4PM - 12AM)', status: 'Active', sales: 'N/A' },
  { id: 'STF-04', name: 'Bilal Khan', role: 'Delivery Rider', shift: 'Evening (4PM - 12AM)', status: 'Active', deliveries: 18 }
];

export const INITIAL_OFFERS = [
  { code: 'FLAT500', title: 'Rs 500 Off', discount_type: 'Fixed', amount: 500, min_order: 2000, valid_till: '2026-10-30', is_active: true },
  { code: 'WELCOME20', title: '20% Welcome Discount', discount_type: 'Percentage', amount: 20, min_order: 1000, valid_till: '2026-12-31', is_active: true },
  { code: 'FREEDRINK', title: 'Free Mint Mojito', discount_type: 'Item', amount: 350, min_order: 1500, valid_till: '2026-09-30', is_active: true }
];

export const INITIAL_RESERVATIONS = [
  { id: 'RES-101', customer: 'Ahmad Raza', phone: '0300-1234567', branch: 'Main Branch', date: '2026-09-12', time: '08:00 PM', guests: 4, status: 'Confirmed' },
  { id: 'RES-102', customer: 'Zainab Bibi', phone: '0321-7778899', branch: 'DHA Phase 5', date: '2026-09-13', time: '07:30 PM', guests: 6, status: 'Confirmed' }
];

export const INITIAL_REVIEWS = [
  { id: 'REV-01', customer: 'Ahmad Raza', invoice: 'INV-1024', rating: 5, text: 'Best smash beef burgers in Lahore! Fast delivery and hot food.', date: '2026-09-10' },
  { id: 'REV-02', customer: 'Sara Malik', invoice: 'INV-1022', rating: 5, text: 'Truffle fettuccine was super creamy and rich. 10/10.', date: '2026-09-09' }
];

export const DASHBOARD_STATS = {
  sales_today: 'Rs 245,500',
  sales_growth: '+12.5%',
  orders_today: 182,
  orders_growth: '+8.2%',
  avg_bill: 'Rs 1,348',
  customers_today: 124,
  pending_orders_count: 5,
  delayed_orders_count: 2,
  floor_occupancy: '65%'
};

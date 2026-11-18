import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Search,
  Heart,
  Star,
  Plus,
  ShoppingBag,
  Clock,
  Sparkles,
  MapPin,
  CheckCircle,
  X,
  Calendar,
  CreditCard,
  MessageSquare,
  Utensils,
  Truck,
  PackageCheck,
  Send
} from 'lucide-react';
import Modal from '../common/Modal';
import Drawer from '../common/Drawer';

export default function CustomerHome() {
  const {
    categories,
    menuItems,
    addToCart,
    cart,
    removeFromCart,
    updateCartQty,
    clearCart,
    placeCustomerOrder,
    createReservation,
    submitReview,
    offers,
    reviews,
    showToast
  } = useRestaurant();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [activeConfirmationInvoice, setActiveConfirmationInvoice] = useState(null);

  // Order options
  const [orderType, setOrderType] = useState('Delivery'); // Delivery, Dine In, Takeaway
  const [customerName, setCustomerName] = useState('Ahmad Raza');
  const [phone, setPhone] = useState('0300-1234567');
  const [deliveryAddress, setDeliveryAddress] = useState('House 42, Johar Town, Lahore');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // ONLINE, COD, CARD
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Reservation form state
  const [resName, setResName] = useState('Ahmad Raza');
  const [resPhone, setResPhone] = useState('0300-1234567');
  const [resDate, setResDate] = useState('2026-09-12');
  const [resTime, setResTime] = useState('08:00 PM');
  const [resGuests, setResGuests] = useState(4);

  // Review form state
  const [revRating, setRevRating] = useState(5);
  const [revText, setRevText] = useState('');

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmt = Math.min(cartSubtotal, couponDiscount);
  const taxAmt = Math.round((cartSubtotal - discountAmt) * 0.05);
  const cartTotal = cartSubtotal - discountAmt + taxAmt;

  const handleApplyCoupon = (code) => {
    const matched = offers.find(o => o.code === code && o.is_active);
    if (matched) {
      setAppliedCoupon(code);
      setCouponDiscount(matched.amount);
      showToast(`Coupon ${code} applied successfully! Discount Rs ${matched.amount}`);
    } else {
      showToast('Invalid or expired coupon code.', 'error');
    }
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    const invoiceNo = placeCustomerOrder({
      customer_name: customerName,
      phone,
      order_type: orderType,
      address: deliveryAddress,
      payment_method: paymentMethod
    });

    setActiveConfirmationInvoice(invoiceNo);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
  };

  const handleConfirmReservation = (e) => {
    e.preventDefault();
    createReservation({ name: resName, phone: resPhone, date: resDate, time: resTime, guests: resGuests });
    setIsReservationOpen(false);
  };

  const handleConfirmReview = (e) => {
    e.preventDefault();
    submitReview({ customer: customerName, invoice: activeConfirmationInvoice || 'INV-1024', rating: revRating, text: revText });
    setIsReviewOpen(false);
    setRevText('');
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Top Promotional Hero & Action Bar */}
      <div className="relative rounded-3xl glass-panel border border-amber-500/30 p-8 lg:p-12 overflow-hidden bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5" /> URY Gourmet Experience
          </div>
          <h1 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Order Online, Reserve Tables & Track Preparation Live.
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Smokey burgers, artisanal woodfired pizzas, and gourmet desserts delivered hot to your doorstep or served directly to your table.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              onClick={() => setIsReservationOpen(true)}
              className="flex items-center gap-2 bg-amber-500 text-slate-950 font-extrabold px-5 py-3 rounded-2xl text-xs shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition"
            >
              <Calendar className="h-4 w-4" /> Reserve A Table
            </button>
            <button
              onClick={() => setIsTrackerOpen(true)}
              className="flex items-center gap-2 glass-card border border-slate-700 text-slate-200 font-bold px-5 py-3 rounded-2xl text-xs hover:border-amber-500 transition"
            >
              <Clock className="h-4 w-4 text-amber-400" /> Track Active Order
            </button>
            <button
              onClick={() => setIsReviewOpen(true)}
              className="flex items-center gap-2 glass-card border border-slate-700 text-slate-200 font-bold px-5 py-3 rounded-2xl text-xs hover:border-amber-500 transition"
            >
              <Star className="h-4 w-4 text-amber-400" /> Write Review
            </button>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="w-full lg:w-80 glass-card p-4 rounded-2xl border border-slate-800 space-y-3 shrink-0">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Gourmet Menu</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search burgers, pizza, drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input pl-9 pr-3 py-2.5 rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Active Promos Banner */}
      <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-none">
        {offers.map(off => (
          <div key={off.code} className="glass-card px-4 py-3 rounded-2xl border border-amber-500/30 flex items-center gap-3 shrink-0">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs">
              {off.code}
            </div>
            <div>
              <div className="text-xs font-extrabold text-white">{off.title}</div>
              <div className="text-[10px] text-slate-400">Min Order: Rs {off.min_order}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'glass-card text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Item Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div
            key={item.item_code}
            className="group glass-card rounded-3xl border border-slate-800/80 overflow-hidden hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src={item.image}
                  alt={item.item_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border bg-slate-950/60 border-slate-700 text-rose-400">
                  <Heart className="h-4 w-4 fill-current" />
                </button>
                <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-amber-400 text-xs font-bold">
                  <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
                  {item.rating} ({item.reviews})
                </div>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                  {item.item_name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Price</span>
                <div className="text-lg font-extrabold text-amber-400">Rs {item.price.toLocaleString()}</div>
              </div>
              <button
                onClick={() => setSelectedItem(item)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Item Detail Customize Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.item_name || 'Customize Item'}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="h-48 rounded-2xl overflow-hidden">
              <img src={selectedItem.image} alt={selectedItem.item_name} className="w-full h-full object-cover" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedItem.description}</p>
            
            {selectedItem.variants && selectedItem.variants.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">Select Size / Variant</label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedItem.variants.map((v, i) => (
                    <button key={i} className="glass-card p-3 rounded-xl text-xs font-semibold text-slate-200 hover:border-amber-500 text-left border border-slate-800">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                addToCart(selectedItem);
                setSelectedItem(null);
              }}
              className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
            >
              Add To Cart — Rs {selectedItem.price.toLocaleString()}
            </button>
          </div>
        )}
      </Modal>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold px-6 py-3.5 rounded-full shadow-2xl shadow-amber-500/30 animate-bounce"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-xs">View Cart ({cart.length} items)</span>
          <span className="bg-slate-950 text-amber-400 text-xs px-2.5 py-0.5 rounded-full">
            Rs {cartTotal.toLocaleString()}
          </span>
        </button>
      )}

      {/* Cart Drawer */}
      <Drawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Your Shopping Cart">
        <div className="space-y-4 h-full flex flex-col justify-between">
          <div className="space-y-3 overflow-y-auto max-h-[50vh]">
            {cart.map(item => (
              <div key={item.item_code} className="glass-card p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{item.item_name}</h4>
                  <p className="text-[11px] text-amber-400 font-semibold">Rs {item.price} x {item.qty}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateCartQty(item.item_code, item.qty - 1)} className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-bold text-xs">-</button>
                  <span className="text-xs font-bold text-white">{item.qty}</span>
                  <button onClick={() => updateCartQty(item.item_code, item.qty + 1)} className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-bold text-xs">+</button>
                  <button onClick={() => removeFromCart(item.item_code)} className="text-rose-400 p-1 ml-2"><X className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-4">
            
            {/* Promo Code Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter promo coupon..."
                value={appliedCoupon}
                onChange={(e) => setAppliedCoupon(e.target.value.toUpperCase())}
                className="glass-input px-3 py-2 rounded-xl text-xs w-full uppercase"
              />
              <button
                onClick={() => handleApplyCoupon(appliedCoupon)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-amber-400 font-bold text-xs hover:bg-slate-700"
              >
                Apply
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>Rs {cartSubtotal.toLocaleString()}</span></div>
              {discountAmt > 0 && <div className="flex justify-between text-rose-400"><span>Promo Discount</span><span>-Rs {discountAmt}</span></div>}
              <div className="flex justify-between text-slate-400"><span>GST Tax (5%)</span><span>Rs {taxAmt}</span></div>
              <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
                <span>Total Amount</span>
                <span className="text-amber-400 text-base">Rs {cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20"
            >
              Proceed to Online Checkout
            </button>
          </div>
        </div>
      </Drawer>

      {/* Checkout Modal (Order Channel & Online Payment Selector) */}
      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Online Checkout & Order Channel">
        <div className="space-y-4">
          
          {/* Order Channel Selector: Dine-In, Takeaway, Delivery */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Choose Order Channel</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { type: 'Delivery', icon: Truck },
                { type: 'Dine In', icon: Utensils },
                { type: 'Takeaway', icon: PackageCheck }
              ].map(ch => {
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.type}
                    onClick={() => setOrderType(ch.type)}
                    className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition border ${
                      orderType === ch.type ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold' : 'glass-card text-slate-300 border-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {ch.type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400">Your Name</label>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full glass-input p-2.5 rounded-xl text-xs text-white mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Phone Number</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full glass-input p-2.5 rounded-xl text-xs text-white mt-1" />
            </div>
          </div>

          {orderType === 'Delivery' && (
            <div>
              <label className="text-xs font-bold text-slate-400">Delivery Street Address</label>
              <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="w-full glass-input p-2.5 rounded-xl text-xs text-white mt-1" />
            </div>
          )}

          {/* Payment Method Picker */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Online Payment Method</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {['ONLINE', 'CARD', 'COD'].map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition border ${
                    paymentMethod === m ? 'bg-amber-500 text-slate-950 border-amber-400' : 'glass-card text-slate-300 border-slate-800'
                  }`}
                >
                  {m === 'COD' ? 'Cash On Delivery' : m}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-4 w-4" /> Confirm & Place Order — Rs {cartTotal.toLocaleString()}
          </button>
        </div>
      </Modal>

      {/* Table Reservation Modal */}
      <Modal isOpen={isReservationOpen} onClose={() => setIsReservationOpen(false)} title="Reserve A Table Online">
        <form onSubmit={handleConfirmReservation} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400">Name</label>
              <input type="text" value={resName} onChange={(e) => setResName(e.target.value)} required className="w-full glass-input p-2.5 rounded-xl text-xs text-white mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Phone</label>
              <input type="text" value={resPhone} onChange={(e) => setResPhone(e.target.value)} required className="w-full glass-input p-2.5 rounded-xl text-xs text-white mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400">Date</label>
              <input type="date" value={resDate} onChange={(e) => setResDate(e.target.value)} required className="w-full glass-input p-2.5 rounded-xl text-xs text-white mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Time</label>
              <input type="text" value={resTime} onChange={(e) => setResTime(e.target.value)} required className="w-full glass-input p-2.5 rounded-xl text-xs text-white mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Guests</label>
              <input type="number" min="1" max="20" value={resGuests} onChange={(e) => setResGuests(e.target.value)} required className="w-full glass-input p-2.5 rounded-xl text-xs text-white mt-1" />
            </div>
          </div>

          <button type="submit" className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20">
            Confirm Table Booking
          </button>
        </form>
      </Modal>

      {/* Order Status Live Tracker Drawer */}
      <Drawer isOpen={isTrackerOpen || !!activeConfirmationInvoice} onClose={() => { setIsTrackerOpen(false); setActiveConfirmationInvoice(null); }} title="Live Order Progress Tracker">
        <div className="space-y-6">
          <div className="glass-card p-4 rounded-2xl border border-amber-500/30 text-center space-y-1">
            <div className="text-xs text-slate-400">Active Invoice #</div>
            <div className="text-xl font-extrabold text-amber-400">{activeConfirmationInvoice || 'INV-1024'}</div>
            <div className="text-[10px] text-emerald-400 font-bold">Estimated Delivery: 22 mins</div>
          </div>

          {/* Timeline */}
          <div className="space-y-4 pl-4 border-l-2 border-amber-500/40 relative">
            {[
              { title: 'Order Placed & Confirmed', desc: 'Received by URY system', done: true },
              { title: 'Kitchen KOT Accepted', desc: 'Chef preparing your meal', done: true },
              { title: 'Order Ready', desc: 'Packed fresh in kitchen', done: false },
              { title: 'Out for Delivery / Served', desc: 'En route to your location', done: false }
            ].map((st, i) => (
              <div key={i} className="relative">
                <div className={`absolute -left-[23px] top-0.5 h-4 w-4 rounded-full border ${st.done ? 'bg-amber-500 border-amber-400' : 'bg-slate-900 border-slate-700'}`}></div>
                <h4 className={`text-xs font-bold ${st.done ? 'text-white' : 'text-slate-500'}`}>{st.title}</h4>
                <p className="text-[11px] text-slate-400">{st.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setIsReviewOpen(true)}
            className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold text-xs flex items-center justify-center gap-2"
          >
            <Star className="h-4 w-4" /> Rate & Review Order
          </button>
        </div>
      </Drawer>

      {/* Rating & Review Modal */}
      <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title="Rate Your Restaurant Experience">
        <form onSubmit={handleConfirmReview} className="space-y-4">
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                type="button"
                key={s}
                onClick={() => setRevRating(s)}
                className={`p-2 rounded-xl transition ${s <= revRating ? 'text-amber-400 scale-110' : 'text-slate-600'}`}
              >
                <Star className="h-7 w-7 fill-current" />
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400">Share your experience / comments</label>
            <textarea
              rows="3"
              value={revText}
              onChange={(e) => setRevText(e.target.value)}
              placeholder="Food quality, delivery speed, taste..."
              required
              className="w-full glass-input p-3 rounded-xl text-xs text-white mt-1"
            ></textarea>
          </div>

          <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20">
            Submit Rating & Review
          </button>
        </form>
      </Modal>

    </div>
  );
}

import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Truck, MapPin, Phone, CheckCircle, Navigation, Clock, Package, Search, Filter } from 'lucide-react';
import Badge from '../common/Badge';

export default function RiderDashboard() {
  const { deliveries, updateDeliveryStatus } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredDeliveries = deliveries.filter(del => {
    const matchesSearch =
      del.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.phone.includes(searchQuery) ||
      del.invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.items_summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      statusFilter === 'ALL' || del.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const countAll = deliveries.length;
  const countAssigned = deliveries.filter(d => d.status === 'Assigned').length;
  const countOut = deliveries.filter(d => d.status === 'Out for Delivery').length;
  const countDelivered = deliveries.filter(d => d.status === 'Delivered').length;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4 animate-fade-in">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-600 font-bold shadow-xs">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900">Delivery Rider Hub</h2>
            <p className="text-[11px] text-gray-500 font-medium">Assigned customer orders & route updates</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-green-50 px-3.5 py-1.5 rounded-xl border border-green-200 text-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Active</span>
            <span className="text-base font-black text-green-700">{countAssigned + countOut}</span>
          </div>
          <div className="bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-200 text-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total</span>
            <span className="text-base font-black text-gray-800">{countAll}</span>
          </div>
        </div>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer, address, invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 pl-9 pr-3 py-2 rounded-xl text-xs outline-none focus:border-green-600 focus:bg-white transition font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All', count: countAll },
              { id: 'Assigned', label: 'Assigned', count: countAssigned },
              { id: 'Out for Delivery', label: 'On Route', count: countOut },
              { id: 'Delivered', label: 'Delivered', count: countDelivered }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Deliveries Grid: 3 cards per row on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredDeliveries.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-2xl border border-gray-200 text-center space-y-2 shadow-sm">
            <Package className="h-9 w-9 text-gray-300 mx-auto" />
            <h3 className="text-xs font-bold text-gray-700">No matching delivery orders</h3>
            <p className="text-[11px] text-gray-400">Try adjusting your search query or status filter tabs.</p>
          </div>
        ) : (
          filteredDeliveries.map(del => (
            <div key={del.invoice} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-green-400 transition duration-150">
              
              {/* Compact Card Top Row: Invoice + Time + Badge */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-900">{del.invoice}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{del.assigned_time}</span>
                </div>
                <Badge status={del.status} />
              </div>

              {/* Compact Customer & Address */}
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-gray-900">{del.customer}</span>
                  <a
                    href={`tel:${del.phone}`}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-200 text-[10.5px] font-bold hover:bg-green-100 transition"
                  >
                    <Phone className="h-3 w-3" /> {del.phone}
                  </a>
                </div>
                <div className="flex items-start gap-1.5 text-[11px] text-gray-600 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-tight">{del.address}</span>
                </div>
              </div>

              {/* Items & Cash Amount */}
              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <div className="min-w-0 pr-2">
                  <span className="text-gray-400">Items: </span>
                  <span className="font-bold text-gray-800 line-clamp-1">{del.items_summary}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider block">Collect Cash</span>
                  <span className="text-sm font-black text-green-700">Rs {del.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Button: Same height h-10 for all states, distinct colors */}
              <div className="pt-1">
                {del.status === 'Assigned' && (
                  <button
                    onClick={() => updateDeliveryStatus(del.invoice, 'Out for Delivery')}
                    className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="h-4 w-4" /> Start Delivery
                  </button>
                )}

                {del.status === 'Out for Delivery' && (
                  <button
                    onClick={() => updateDeliveryStatus(del.invoice, 'Delivered')}
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" /> Mark Delivered
                  </button>
                )}

                {del.status === 'Delivered' && (
                  <div className="w-full h-10 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 font-extrabold text-xs text-center flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" /> Delivered
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}

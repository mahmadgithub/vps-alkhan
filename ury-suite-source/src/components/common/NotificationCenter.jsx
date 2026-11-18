import React, { useState } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Clock, ShoppingBag, Calendar, DollarSign, Boxes } from 'lucide-react';

export default function NotificationCenter({ notifications, onClearAll }) {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type) => {
    switch (type) {
      case 'order_confirmed': return <ShoppingBag className="h-4 w-4 text-sky-400" />;
      case 'kot_preparing': return <Clock className="h-4 w-4 text-amber-400" />;
      case 'order_ready': return <CheckCircle className="h-4 w-4 text-purple-400" />;
      case 'out_for_delivery': return <CheckCircle className="h-4 w-4 text-purple-400" />;
      case 'order_delivered': return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'reservation_confirmed': return <Calendar className="h-4 w-4 text-emerald-400" />;
      case 'payment_successful': return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case 'low_inventory': return <AlertTriangle className="h-4 w-4 text-rose-400" />;
      default: return <Bell className="h-4 w-4 text-amber-400" />;
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-slate-700 transition"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500"></span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 lg:w-96 glass-panel rounded-2xl border border-slate-700 shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">System Notifications</h4>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                {unreadCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={onClearAll} className="text-[10px] text-slate-400 hover:text-white underline">
                  Clear All
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">No new system notifications.</div>
            ) : (
              notifications.map((n, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/50 transition">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

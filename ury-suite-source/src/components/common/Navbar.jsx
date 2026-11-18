import React, { useState } from 'react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Search, Bell, ChevronDown, Settings, Sun,
  Clock, ChefHat, Truck, CreditCard, LayoutDashboard, Database
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const { currentRole, switchRole, user } = useAuth();
  const { isLiveConnected } = useRestaurant();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications] = useState([
    { type: 'order_confirmed', title: 'New Order Received', message: 'Invoice #INV-1024 placed for Dine-in Table T04', time: '2m ago' },
    { type: 'kot_preparing', title: 'Kitchen KOT Preparation', message: 'Chef started preparing KOT-1021', time: '5m ago' },
    { type: 'low_inventory', title: 'Low Inventory Alert', message: 'Aged Cheddar Cheese stock low (4 kg left)', time: '12m ago' }
  ]);

  const rolePills = [
    { key: ROLES.WAITER, label: 'Waiter', icon: Clock },
    { key: ROLES.KITCHEN, label: 'Kitchen KOT', icon: ChefHat },
    { key: ROLES.RIDER, label: 'Delivery', icon: Truck },
    { key: ROLES.POS, label: 'Speed POS', icon: CreditCard },
    { key: ROLES.ADMIN, label: 'Admin / Manager', icon: LayoutDashboard }
  ];

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AM';

  return (
    <>
      {/* Top Bar */}
      <header className="topnav">
        <div className="topnav-search">
          <Search className="topnav-search-icon" />
          <input placeholder="Search orders, customers, items..." />
          <span className="topnav-kbd" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>⌘ K</span>
        </div>

        <div className="topnav-right">
          {/* Live Backend Connection Indicator */}
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
            isLiveConnected ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
          }`}>
            <Database size={12} />
            <span>{isLiveConnected ? 'API Connected' : 'Connecting API...'}</span>
          </div>

          <button className="topnav-notif" onClick={() => setNotifOpen(!notifOpen)}>
            <Bell size={16} />
            <span className="notif-dot" />
          </button>

          <button className="topnav-notif">
            <Settings size={16} />
          </button>

          <div className="topnav-user">
            <div className="topnav-avatar">{initials}</div>
            <div className="topnav-user-info">
              <h4>{user?.name || 'Ahmad Manager'}</h4>
              <p>{user?.role || 'Admin'}</p>
            </div>
            <ChevronDown size={14} color="#9ca3af" />
          </div>
        </div>
      </header>

      {/* Role Switcher */}
      <div className="role-bar">
        {rolePills.map(pill => {
          const Icon = pill.icon;
          return (
            <button
              key={pill.key}
              onClick={() => switchRole(pill.key)}
              className={`role-pill ${currentRole === pill.key ? 'active' : ''}`}
            >
              <Icon size={13} />
              {pill.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

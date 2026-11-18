import React from 'react';
import {
  LayoutDashboard, Grid, ShoppingBag, ChefHat, Truck, CreditCard,
  Boxes, Users, UserCheck, BarChart3, Sparkles, Utensils, Tag,
  GitBranch, ArrowRight, Calendar
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuGroups = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'flowchart', label: 'System Pipeline Flow', icon: GitBranch },
        { id: 'orders', label: 'Order Manager', icon: ShoppingBag, badge: 3 },
        { id: 'tables-view', label: 'Live Tables', icon: Grid },
        { id: 'kitchen', label: 'Kitchen KOT', icon: ChefHat },
        { id: 'delivery', label: 'Delivery Hub', icon: Truck },
        { id: 'pos', label: 'Speed POS', icon: CreditCard },
      ]
    },
    {
      title: 'ADMIN & SETUP',
      items: [
        { id: 'menu-manager', label: 'Menu & Dishes', icon: Utensils },
        { id: 'table-manager', label: 'Table Config', icon: Grid },
        { id: 'reservations', label: 'Table Reservations', icon: Calendar },
        { id: 'offers-manager', label: 'Discounts & Offers', icon: Tag },
        { id: 'inventory', label: 'Inventory Stock', icon: Boxes },
        { id: 'customers', label: 'Customers & CRM', icon: Users },
        { id: 'staff', label: 'Staff & Roles', icon: UserCheck },
      ]
    },
    {
      title: 'ANALYTICS & WIZARD',
      items: [
        { id: 'reports', label: 'Reports Hub', icon: BarChart3 },
        { id: 'setup', label: 'Setup Wizard', icon: Sparkles },
      ]
    }
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Utensils size={18} color="white" />
        </div>
        <div className="sidebar-logo-text">
          <h2>Restaurant Portal</h2>
          <p>Management Suite v2.0</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingBottom: 16 }}>
        {menuGroups.map((group, gi) => (
          <div key={gi}>
            <div className="sidebar-section-title">{group.title}</div>
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={15} className="sidebar-item-icon" />
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-badge">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Promo Card */}
      <div className="sidebar-promo">
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 80, height: 80,
          background: 'rgba(22,163,74,0.15)', borderRadius: '0 14px 0 80px'
        }} />
        <h4>Better Food<br />Bigger Smiles</h4>
        <p>Manage your restaurant with ease and efficiency.</p>
        <button className="sidebar-promo-btn">
          <ArrowRight size={14} color="white" />
        </button>
      </div>
    </aside>
  );
}

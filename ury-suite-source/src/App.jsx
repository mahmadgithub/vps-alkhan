import React, { useState, Component } from 'react';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
import { RestaurantProvider } from './context/RestaurantContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Toast from './components/common/Toast';

import WaiterDashboard from './components/waiter/WaiterDashboard';
import KotDisplay from './components/kitchen/KotDisplay';
import RiderDashboard from './components/delivery/RiderDashboard';
import PosScreen from './components/pos/PosScreen';

import AdminDashboard from './components/admin/AdminDashboard';
import SystemFlowchart from './components/admin/SystemFlowchart';
import OrderManager from './components/admin/OrderManager';
import InventoryManager from './components/admin/InventoryManager';
import CustomerManager from './components/admin/CustomerManager';
import StaffManager from './components/admin/StaffManager';
import MenuManager from './components/admin/MenuManager';
import TableManager from './components/admin/TableManager';
import ReservationManager from './components/admin/ReservationManager';
import OfferManager from './components/admin/OfferManager';
import ReportsHub from './components/admin/ReportsHub';
import SetupWizard from './components/admin/SetupWizard';

class TabErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("TabErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-100 shadow-lg text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">!</div>
          <h2 className="text-lg font-extrabold text-gray-900">Tab Content Render Warning</h2>
          <p className="text-xs text-rose-700 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100 font-mono text-left overflow-x-auto">
            {this.state.error?.toString() || 'An unexpected rendering error occurred'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="px-5 py-2.5 bg-green-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-green-700 transition"
          >
            Reset Tab & Return to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function MainContent() {
  const { currentRole } = useAuth();
  const [adminTab, setAdminTab] = useState('dashboard');

  const renderAdminTab = () => {
    switch (adminTab) {
      case 'dashboard': return <AdminDashboard />;
      case 'flowchart': return <SystemFlowchart />;
      case 'orders': return <OrderManager />;
      case 'tables-view': return <WaiterDashboard />;
      case 'kitchen': return <KotDisplay />;
      case 'delivery': return <RiderDashboard />;
      case 'pos': return <PosScreen />;
      case 'menu-manager': return <MenuManager />;
      case 'table-manager': return <TableManager />;
      case 'reservations': return <ReservationManager />;
      case 'offers-manager': return <OfferManager />;
      case 'inventory': return <InventoryManager />;
      case 'customers': return <CustomerManager />;
      case 'staff': return <StaffManager />;
      case 'reports': return <ReportsHub />;
      case 'setup': return <SetupWizard />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar only for Admin */}
      {currentRole === ROLES.ADMIN && (
        <Sidebar activeTab={adminTab} setActiveTab={setAdminTab} />
      )}

      {/* Main wrapper */}
      <div className={`main-wrapper ${currentRole !== ROLES.ADMIN ? 'ml-0' : ''}`}
        style={{ marginLeft: currentRole === ROLES.ADMIN ? '220px' : '0' }}>
        <Navbar />
        <main style={{ flex: 1, background: '#f5f6fa', minHeight: 'calc(100vh - 96px)' }}>
          <TabErrorBoundary key={currentRole}>
            {currentRole === ROLES.WAITER && <WaiterDashboard />}
            {currentRole === ROLES.KITCHEN && <KotDisplay />}
            {currentRole === ROLES.RIDER && <RiderDashboard />}
            {currentRole === ROLES.POS && <PosScreen />}
            {currentRole === ROLES.ADMIN && (
              <TabErrorBoundary key={adminTab} onReset={() => setAdminTab('dashboard')}>
                {renderAdminTab()}
              </TabErrorBoundary>
            )}
          </TabErrorBoundary>
        </main>
      </div>

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RestaurantProvider>
        <MainContent />
      </RestaurantProvider>
    </AuthProvider>
  );
}

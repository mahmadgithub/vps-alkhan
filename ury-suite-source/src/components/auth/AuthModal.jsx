import React, { useState } from 'react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { User, Lock, Mail, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import Modal from '../common/Modal';

export default function AuthModal({ isOpen, onClose }) {
  const { switchRole, setUser } = useAuth();
  const { showToast } = useRestaurant();

  const [mode, setMode] = useState('login'); // login vs register
  const [email, setEmail] = useState('ahmad@ury.restaurant');
  const [password, setPassword] = useState('Ahmad@12345');
  const [name, setName] = useState('Ahmad Raza');
  const [selectedRole, setSelectedRole] = useState(ROLES.ADMIN);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    
    // System credential validation & role identification simulation
    setUser({
      name: name || 'Ahmad User',
      email: email,
      role: selectedRole.toUpperCase(),
      branch: 'Main Branch'
    });

    switchRole(selectedRole);
    showToast(`Authentication validated! Redirected to ${selectedRole.toUpperCase()} Dashboard.`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Authentication & System Access">
      <div className="space-y-6">
        
        {/* Toggle Login vs Register */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('login')}
            className={`w-1/2 py-2 rounded-lg text-xs font-bold transition ${
              mode === 'login' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In / Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`w-1/2 py-2 rounded-lg text-xs font-bold transition ${
              mode === 'register' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Customer Account
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold text-slate-400">Full Name</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full glass-input pl-9 pr-3 py-2.5 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-400">Email Address / Phone</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="email@example.com or phone"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full glass-input pl-9 pr-3 py-2.5 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full glass-input pl-9 pr-3 py-2.5 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          {/* Role Identification Selector */}
          <div>
            <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">Role Identification & Redirect</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {[
                { role: ROLES.CUSTOMER, label: 'Customer' },
                { role: ROLES.WAITER, label: 'Waiter' },
                { role: ROLES.KITCHEN, label: 'Kitchen' },
                { role: ROLES.RIDER, label: 'Delivery' },
                { role: ROLES.POS, label: 'Cashier' },
                { role: ROLES.ADMIN, label: 'Admin' }
              ].map(r => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => setSelectedRole(r.role)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    selectedRole === r.role ? 'bg-amber-500 text-slate-950 border-amber-400' : 'glass-card text-slate-400 border-slate-800'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="h-4 w-4" /> Validate & Redirect to Dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </form>

      </div>
    </Modal>
  );
}

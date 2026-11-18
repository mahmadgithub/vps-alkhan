import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const ROLES = {
  WAITER: 'waiter',
  KITCHEN: 'kitchen',
  RIDER: 'rider',
  POS: 'pos',
  ADMIN: 'admin'
};

export const AuthProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState(ROLES.ADMIN); // Default to Admin for comprehensive overview
  const [user, setUser] = useState({
    name: 'Ahmad Manager',
    email: 'ahmad@ury.restaurant',
    role: 'Administrator',
    branch: 'Main Branch'
  });
  const [authToken, setAuthToken] = useState('demo-token-12345');

  const switchRole = (newRole) => {
    setCurrentRole(newRole);
    if (newRole === ROLES.WAITER) {
      setUser(prev => ({ ...prev, name: 'Ahmad Waiter', role: 'Waiter' }));
    } else if (newRole === ROLES.KITCHEN) {
      setUser(prev => ({ ...prev, name: 'Hamza Chef', role: 'Head Chef' }));
    } else if (newRole === ROLES.RIDER) {
      setUser(prev => ({ ...prev, name: 'Bilal Rider', role: 'Delivery Rider' }));
    } else if (newRole === ROLES.POS) {
      setUser(prev => ({ ...prev, name: 'Ali Cashier', role: 'POS Cashier' }));
    } else if (newRole === ROLES.ADMIN) {
      setUser(prev => ({ ...prev, name: 'Ahmad Manager', role: 'Administrator' }));
    }
  };

  return (
    <AuthContext.Provider value={{ currentRole, switchRole, user, setUser, authToken, setAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

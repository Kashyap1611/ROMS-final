import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerView from './pages/CustomerView';
import ManagerDashboard from './pages/ManagerDashboard';
import KitchenDashboard from './pages/KitchenDashboard';
import ManagerLogin from './pages/ManagerLogin';
import KitchenLogin from './pages/KitchenLogin';
import { Toaster } from './components/ui/sonner';
import './App.css';
import socket from './socket';
import axios from 'axios';

export const AppContext = React.createContext();

function App() {

  const [gstRate, setGstRate] = useState(0.05);
  const [maxCapacity, setMaxCapacity] = useState(50);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState(
    !!localStorage.getItem('roms_token')
  );
  const [userRole, setUserRole] = useState(
    localStorage.getItem('roms_role') || ''
  );

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const results = await Promise.allSettled([
          axios.get('/api/menu'),
          axios.get('/api/tables'),
          axios.get('/api/orders'),
          axios.get('/api/settings')
        ]);

        const [menuRes, tablesRes, ordersRes, settingsRes] = results;

        if (menuRes.status === 'fulfilled') {
          const data = menuRes.value.data || [];
          setMenuItems(data.map(i => ({ id: i._id || i.id, ...i })));
        }
        if (tablesRes.status === 'fulfilled') {
          const data = tablesRes.value.data || [];
          setTables(data.map(t => ({ id: t._id || t.id, ...t })));
        }
        if (ordersRes.status === 'fulfilled') {
          const data = ordersRes.value.data || [];
          setOrders(data.map(o => ({ id: o._id || o.id, ...o })));
        }
        if (settingsRes.status === 'fulfilled') {
          const data = settingsRes.value.data || {};
          if (data.gstRate !== undefined) setGstRate(Number(data.gstRate));
          if (data.maxCapacity !== undefined) setMaxCapacity(Number(data.maxCapacity));
        }
      } catch (e) {
        console.error("Error in loadData:", e);
      }
    };
    loadData();
    // Socket-driven refresh: fetch on server events
    const refreshOrders = async () => {
      try {
        const res = await axios.get('/api/orders');
        const data = res?.data ?? [];
        setOrders((data || []).map(o => ({ id: o._id || o.id, ...o })));
      } catch {}
    };
    const refreshTables = async () => {
      try {
        const res = await axios.get('/api/tables');
        const data = res?.data ?? [];
        setTables((data || []).map(t => ({ id: t._id || t.id, ...t })));
      } catch {}
    };
    const refreshMenu = async () => {
      try {
        const res = await axios.get('/api/menu');
        const data = res?.data ?? [];
        setMenuItems((data || []).map(i => ({ id: i._id || i.id, ...i })));
      } catch {}
    };

    const onOrdersUpdated = () => { refreshOrders(); };
    const onTablesUpdated = () => { refreshTables(); };
    const onMenuUpdated = () => { refreshMenu(); };

    socket.on('orders:updated', onOrdersUpdated);
    socket.on('order:itemUpdated', onOrdersUpdated);
    socket.on('tables:updated', onTablesUpdated);
    socket.on('menu:updated', onMenuUpdated);

    // Refresh on focus/visibility change
    const onFocus = () => { refreshOrders(); refreshTables(); refreshMenu(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') { refreshOrders(); refreshTables(); refreshMenu(); } };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      socket.off('orders:updated', onOrdersUpdated);
      socket.off('order:itemUpdated', onOrdersUpdated);
      socket.off('tables:updated', onTablesUpdated);
      socket.off('menu:updated', onMenuUpdated);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  

  const loginManager = async (email, password) => {
    try {
      const res = await axios.post('/api/manager/login', { email, password });
      if (!res || !res.data) {
        setIsManagerAuthenticated(false);
        setUserRole('');
        return null;
      }
      const data = res.data;
      localStorage.setItem('roms_token', data.token || '');
      localStorage.setItem('roms_user', JSON.stringify({ email: data.email, _id: data._id }));
      localStorage.setItem('roms_role', data.role || 'manager');
      setIsManagerAuthenticated(true);
      setUserRole(data.role || 'manager');
      return data.role || 'manager';
    } catch (e) {
      setIsManagerAuthenticated(false);
      setUserRole('');
      return null;
    }
  };

  const loginKitchen = async (email, password) => {
    try {
      const res = await axios.post('/api/kitchen/login', { email, password });
      if (!res || !res.data) {
        setIsManagerAuthenticated(false);
        setUserRole('');
        return false;
      }
      const data = res.data;
      localStorage.setItem('roms_token', data.token || '');
      localStorage.setItem('roms_user', JSON.stringify({ email: data.email, _id: data._id }));
      localStorage.setItem('roms_role', 'kitchen');
      setIsManagerAuthenticated(true);
      setUserRole('kitchen');
      return true;
    } catch (e) {
      setIsManagerAuthenticated(false);
      setUserRole('');
      return false;
    }
  };

  const logoutManager = () => {
    localStorage.removeItem('roms_token');
    localStorage.removeItem('roms_user');
    localStorage.removeItem('roms_role');
    setIsManagerAuthenticated(false);
    setUserRole('');
  };

  const contextValue = {
    orders,
    setOrders,
    menuItems,
    setMenuItems,
    tables,
    setTables,
    gstRate,
    setGstRate,
    maxCapacity,
    setMaxCapacity,
    isManagerAuthenticated,
    userRole,
    loginManager,
    loginKitchen,
    logoutManager
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/table/:tableId" element={<CustomerView />} />
            <Route path="/manager/*" element={<ManagerDashboard />} />
            <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
            <Route path="/kitchen/login" element={<KitchenLogin />} />
            <Route path="/login" element={<ManagerLogin />} />
            <Route path="/" element={<Navigate to="/manager/dashboard" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AppContext.Provider>
  );
}

export default App;

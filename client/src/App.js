import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerView from './pages/CustomerView';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerLogin from './pages/ManagerLogin';
import { Toaster } from './components/ui/sonner';
import './App.css';
import socket from './socket';
import axios from 'axios';

export const AppContext = React.createContext();

function App() {

  const [gstRate, setGstRate] = useState(0.05);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState(
    !!localStorage.getItem('roms_token')
  );
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [menuRes, tablesRes, ordersRes, settingsRes] = await Promise.all([
          axios.get('/api/menu'),
          axios.get('/api/tables'),
          axios.get('/api/orders'),
          axios.get('/api/settings')
        ]);
        const [menuJson, tablesJson, ordersJson, settingsJson] = [
          menuRes?.data ?? [],
          tablesRes?.data ?? [],
          ordersRes?.data ?? [],
          settingsRes?.data ?? {}
        ];
        setMenuItems((menuJson || []).map(i => ({ id: i._id || i.id, ...i })));
        setTables((tablesJson || []).map(t => ({ id: t._id || t.id, ...t })));
        setOrders((ordersJson || []).map(o => ({ id: o._id || o.id, ...o })));
        if (settingsJson && typeof settingsJson.gstRate === 'number') {
          setGstRate(settingsJson.gstRate);
        }
      } catch (e) {
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
    const onOrdersUpdated = () => { refreshOrders(); };
    const onTablesUpdated = () => { refreshTables(); };
    socket.on('orders:updated', onOrdersUpdated);
    socket.on('order:itemUpdated', onOrdersUpdated);
    socket.on('tables:updated', onTablesUpdated);
    // Refresh on focus/visibility change
    const onFocus = () => { refreshOrders(); refreshTables(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') { refreshOrders(); refreshTables(); } };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      socket.off('orders:updated', onOrdersUpdated);
      socket.off('order:itemUpdated', onOrdersUpdated);
      socket.off('tables:updated', onTablesUpdated);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  

  const loginManager = async (email, password) => {
    try {
      const res = await axios.post('/api/manager/login', { email, password });
      if (!res || !res.data) {
        setIsManagerAuthenticated(false);
        return false;
      }
      const data = res.data;
      localStorage.setItem('roms_token', data.token || '');
      localStorage.setItem('roms_user', JSON.stringify({ email: data.email, _id: data._id }));
      setIsManagerAuthenticated(true);
      return true;
    } catch (e) {
      setIsManagerAuthenticated(false);
      return false;
    }
  };
  const logoutManager = () => {
    localStorage.removeItem('roms_token');
    localStorage.removeItem('roms_user');
    setIsManagerAuthenticated(false);
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
    isManagerAuthenticated,
    loginManager,
    logoutManager
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/table/:tableId" element={<CustomerView />} />
            <Route path="/manager/*" element={<ManagerDashboard />} />
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

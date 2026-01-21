import React, { useContext, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
// import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LayoutDashboard, UtensilsCrossed, QrCode, ChefHat, Menu as MenuIcon, Settings as SettingsIcon, LogOut } from 'lucide-react';
import Dashboard from '../components/manager/Dashboard';
import OrdersView from '../components/manager/OrdersView';
import MenuManagement from '../components/manager/MenuManagement';
import TableManagement from '../components/manager/TableManagement';
import Settings from '../components/manager/Settings';
import KitchenDisplay from './KitchenDisplay';
import { AppContext } from '../App';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isManagerAuthenticated, logoutManager } = useContext(AppContext);
  useEffect(() => {
    if (!isManagerAuthenticated) navigate('/login', { replace: true });
  }, [isManagerAuthenticated, navigate]);
  
  const currentPath = location.pathname.split('/').pop() || 'dashboard';
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/manager/dashboard' },
    { id: 'orders', label: 'Orders', icon: ChefHat, path: '/manager/orders' },
    { id: 'kitchen', label: 'Kitchen', icon: ChefHat, path: '/manager/kitchen' },
    { id: 'menu', label: 'Menu', icon: MenuIcon, path: '/manager/menu' },
    { id: 'tables', label: 'Tables', icon: QrCode, path: '/manager/tables' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/manager/settings' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Manager Dashboard</h1>
                <p className="text-sm text-muted-foreground">Restaurant Management System</p>
              </div>
            </div>
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => {
                  logoutManager();
                  navigate('/login', { replace: true });
                }}
                className="gap-2"
                aria-label="Logout">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="orders" element={<OrdersView />} />
          <Route path="kitchen" element={<KitchenDisplay />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="tables" element={<TableManagement />} />
          <Route path="settings" element={<Settings />} />
          <Route path="/" element={<Navigate to="/manager/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default ManagerDashboard;

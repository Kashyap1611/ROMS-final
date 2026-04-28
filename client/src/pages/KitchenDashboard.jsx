import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import KitchenDisplay from './KitchenDisplay';
import { AppContext } from '../App';

const KitchenDashboard = () => {
  const navigate = useNavigate();
  const { isManagerAuthenticated, userRole, logoutManager } = useContext(AppContext);

  useEffect(() => {
    if (!isManagerAuthenticated) {
      navigate('/kitchen/login', { replace: true });
    } else if (userRole !== 'kitchen') {
      navigate('/manager/dashboard', { replace: true });
    }
  }, [isManagerAuthenticated, userRole, navigate]);

  const handleLogout = () => {
    logoutManager();
    navigate('/kitchen/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="bg-card border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Kitchen Display</h1>
              <p className="text-sm text-muted-foreground">Manage orders and item preparation</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <KitchenDisplay hideHeader={true} />
      </div>
    </div>
  );
};

export default KitchenDashboard;
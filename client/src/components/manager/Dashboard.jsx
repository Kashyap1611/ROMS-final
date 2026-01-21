import React, { useContext } from 'react';
import { AppContext } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ShoppingBag, Users, DollarSign, TrendingUp, Clock } from 'lucide-react';

const Dashboard = () => {
  const { orders, menuItems, tables } = useContext(AppContext);
  
  // Calculate stats
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const availableMenuItems = menuItems.filter(i => i.available).length;
  
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const dayOrders = orders.filter(o => new Date(o.timestamp) >= startOfDay);
  const dayRevenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
  const startOfWeek = new Date();
  const dayIdx = startOfWeek.getDay();
  const diffToMonday = (dayIdx + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const weekOrders = orders.filter(o => new Date(o.timestamp) >= startOfWeek);
  const weekRevenue = weekOrders.reduce((sum, o) => sum + o.total, 0);
  
  // Get recent orders
  const recentOrders = [...orders].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  ).slice(0, 5);
  
  // Calculate popular items
  const itemCounts = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (itemCounts[item.name]) {
        itemCounts[item.name] += item.quantity;
      } else {
        itemCounts[item.name] = item.quantity;
      }
    });
  });
  
  const popularItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  
  const stats = [
    {
      title: 'Revenue (Today)',
      value: `$${dayRevenue.toFixed(2)}`,
      sub: `This week: $${weekRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Orders (Today)',
      value: dayOrders.length,
      sub: `This week: ${weekOrders.length}`,
      icon: ShoppingBag,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Active Tables',
      value: `${occupiedTables}/${tables.length}`,
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      title: 'Menu Items',
      value: availableMenuItems,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10'
    }
  ];
  
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'status-pending' },
      confirmed: { label: 'Confirmed', className: 'status-confirmed' },
      preparing: { label: 'Preparing', className: 'status-preparing' },
      ready: { label: 'Ready', className: 'status-ready' },
      completed: { label: 'Completed', className: 'status-completed' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };
  
  return (
    <div className="space-y-8 page-transition">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="card-interactive">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.sub && (
                  <div className="text-xs text-muted-foreground mt-1">{stat.sub}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Recent Orders and Popular Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Table #{order.tableNumber}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} items • {new Date(order.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Popular Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Popular Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {popularItems.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-700' :
                      index === 1 ? 'bg-gray-400/20 text-gray-700' :
                      index === 2 ? 'bg-orange-500/20 text-orange-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.count} orders</p>
                    </div>
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${(item.count / popularItems[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Order Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-warning mb-2">{pendingOrders}</div>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
            </div>
            <div className="text-center border-x">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status)).length}
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-2">{completedOrders}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

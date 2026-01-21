import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ChefHat, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const KitchenDisplay = () => {
  const { orders, setOrders } = useContext(AppContext);
  const isPersistedId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  const activeOrders = orders.filter(o => ['confirmed', 'preparing'].includes(o.status) && isPersistedId(o.id));

  const setItemStatus = async (order, index, status) => {
    try {
      if (!isPersistedId(order.id)) {
        toast.error('This order is a sample and cannot be updated');
        return;
      }
      const res = await axios.patch(`/api/orders/${order.id}/items/${index}/status`, { status });
      const updated = res?.data;
      if (!updated) {
        toast.error('Failed to update item');
        return;
      }
      const updatedId = updated._id || updated.id || order.id;
      setOrders(orders.map(o => o.id === updatedId ? { id: updatedId, ...updated } : o));
      const refresh = await axios.get('/api/orders');
      const data = refresh?.data ?? [];
      setOrders((data || []).map(o => ({ id: o._id || o.id, ...o })));
      toast.success(`Item updated to ${status}`);
    } catch {
      toast.error('Failed to update item');
    }
  };

  const getItemBadge = (status) => {
    const map = {
      pending: { label: 'Pending', className: 'status-pending', icon: Clock },
      confirmed: { label: 'Confirmed', className: 'status-confirmed', icon: CheckCircle2 },
      prepared: { label: 'Prepared', className: 'status-preparing', icon: ChefHat },
    };
    const cfg = map[status] || map.pending;
    const Icon = cfg.icon;
    return (
      <Badge className={`${cfg.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="bg-card border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Kitchen Display</h1>
              <p className="text-sm text-muted-foreground">Manage item statuses for confirmed orders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeOrders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ChefHat className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No confirmed orders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map(order => (
              <Card key={order.id} className="card-interactive">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Table #{order.tableNumber}</CardTitle>
                    <Badge className="status-confirmed">Confirmed</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(order.timestamp).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div>
                          <p className="font-medium">{it.name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {it.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getItemBadge(it.status)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setItemStatus(order, idx, 'confirmed')}
                            disabled={!isPersistedId(order.id) || it.status !== 'pending'}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary"
                            onClick={() => setItemStatus(order, idx, 'prepared')}
                            disabled={!isPersistedId(order.id) || it.status === 'prepared'}
                          >
                            Prepared
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;

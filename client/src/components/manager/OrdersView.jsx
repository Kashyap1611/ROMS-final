import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Clock, CheckCircle2, ChefHat, TrendingUp } from 'lucide-react';
import { Input } from '../ui/input';
import axios from 'axios';

const OrdersView = () => {
  const { orders, setOrders, gstRate, tables, setTables } = useContext(AppContext);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const formatCurrency = (n) => `$${n.toFixed(2)}`;
  const calculateTotals = (order) => {
    const subtotal = order.total;
    const gst = subtotal * gstRate;
    const grand = subtotal + gst;
    return { subtotal, gst, grand };
  };
  const generateInvoiceHtml = (order) => {
    const { subtotal, gst, grand } = calculateTotals(order);
    const dateStr = new Date(order.timestamp).toLocaleString();
    const itemsHtml = order.items.map(i => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(i.price)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(i.price * i.quantity)}</td>
      </tr>
    `).join('');
    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice #${order.id}</title>
          <style>
            body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #faf6f3; color: #2b1f14; }
            .container { max-width: 720px; margin: 40px auto; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(217,107,42,0.08); }
            .header { text-align:center; margin-bottom: 16px; }
            .title { font-size: 24px; font-weight: 700; }
            .sub { color: #6b5a4d; font-size: 13px; }
            .badge { display:inline-block; padding:4px 10px; border-radius: 999px; background: rgba(217,107,42,0.1); color: #d96b2a; font-weight: 600; margin-top:8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { text-align: left; font-size: 13px; color: #6b5a4d; padding: 8px; border-bottom: 1px solid #eee; }
            .totals { margin-top: 16px; padding-top: 10px; border-top: 1px solid #eee; }
            .row { display:flex; justify-content: space-between; margin: 4px 0; }
            .grand { font-weight: 700; font-size: 18px; color: #d96b2a; }
            .footer { text-align:center; margin-top: 24px; color: #6b5a4d; font-size: 12px; }
            .brand { font-weight: 700; color: #d96b2a; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title"><span class="brand">ROMS</span> Invoice</div>
              <div class="sub">Order #${order.id} • Table #${order.tableNumber} • ${dateStr}</div>
              <div class="badge">Completed</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align:center">Qty</th>
                  <th style="text-align:right">Price</th>
                  <th style="text-align:right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div class="totals">
              <div class="row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
              <div class="row"><span>GST (5%)</span><span>${formatCurrency(gst)}</span></div>
              <div class="row grand"><span>Grand Total</span><span>${formatCurrency(grand)}</span></div>
            </div>
            <div class="footer">Thank you for dining with us</div>
          </div>
        </body>
      </html>
    `;
  };
  // generateInvoiceHtml retained for potential future HTML preview; not used currently.
  const downloadInvoice = (order) => {
    const doc = new jsPDF();
    const dateStr = new Date(order.timestamp).toLocaleString();
    doc.setFontSize(16);
    doc.text('ROMS Invoice', 105, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Order #${order.id} • Table #${order.tableNumber}`, 105, 22, { align: 'center' });
    doc.text(`${dateStr}`, 105, 28, { align: 'center' });
    const gst = order.total * gstRate;
    const grand = order.total + gst;
    const rows = order.items.map(i => [i.name, String(i.quantity), `$${i.price.toFixed(2)}`, `$${(i.price * i.quantity).toFixed(2)}`]);
    autoTable(doc, {
      startY: 36,
      head: [['Item','Qty','Price','Amount']],
      body: rows
    });
    const endY = doc.lastAutoTable.finalY || 36;
    doc.text(`Subtotal: $${order.total.toFixed(2)}`, 14, endY + 10);
    doc.text(`GST (${(gstRate*100).toFixed(0)}%): $${gst.toFixed(2)}`, 14, endY + 16);
    doc.setFontSize(13);
    doc.text(`Grand Total: $${grand.toFixed(2)}`, 14, endY + 24);
    doc.save(`invoice-${order.id}.pdf`);
    toast.success(`Invoice PDF downloaded for Order #${order.id}`);
  };
  
  const addSampleOrders = () => {
    const now = Date.now();
    const sample = [
      {
        id: 101,
        tableNumber: 2,
        timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
        status: 'pending',
        total: 37.98,
        items: [
          { name: 'Grilled Salmon', price: 18.99, quantity: 2, image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=200' }
        ]
      },
      {
        id: 102,
        tableNumber: 5,
        timestamp: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
        status: 'completed',
        total: 24.48,
        items: [
          { name: 'Caesar Salad', price: 8.99, quantity: 1, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200' },
          { name: 'Fresh Lemonade', price: 3.99, quantity: 2, image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f4d?w=200' }
        ]
      },
      {
        id: 103,
        tableNumber: 7,
        timestamp: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
        status: 'preparing',
        total: 14.99,
        items: [
          { name: 'Beef Burger', price: 14.99, quantity: 1, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200' }
        ]
      },
      {
        id: 104,
        tableNumber: 1,
        timestamp: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
        status: 'completed',
        total: 20.98,
        items: [
          { name: 'Tiramisu', price: 6.99, quantity: 1, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200' },
          { name: 'Iced Coffee', price: 4.49, quantity: 2, image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=200' }
        ]
      }
    ];
    setOrders(prev => {
      const existingIds = new Set(prev.map(o => o.id));
      const merged = [...prev, ...sample.filter(o => !existingIds.has(o.id))];
      toast.success('Sample orders added');
      return merged;
    });
  };
  
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      const updated = res?.data;
      if (!updated) {
        toast.error('Failed to update status');
        return;
      }
      const updatedId = updated._id || updated.id || orderId;
      setOrders(orders.map(order => 
        order.id === updatedId ? { ...order, ...updated, id: updatedId } : order
      ));
      const ordersRes = await axios.get('/api/orders');
      const latestOrders = ordersRes?.data ?? [];
      setOrders((latestOrders || []).map(o => ({ id: o._id || o.id, ...o })));
      const tablesRes = await axios.get('/api/tables');
      const latestTables = tablesRes?.data ?? [];
      setTables((latestTables || []).map(t => ({ id: t._id || t.id, ...t })));
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };
  
  const getFilteredOrders = () => {
    if (filterStatus === 'all') return orders;
    if (filterStatus === 'active') {
      return orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status));
    }
    const list = orders.filter(o => o.status === filterStatus);
    if (filterStatus === 'completed' && (fromDate || toDate)) {
      const fromMs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : -Infinity;
      const toMs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : Infinity;
      return list.filter(o => {
        const t = new Date(o.timestamp).getTime();
        return t >= fromMs && t <= toMs;
      });
    }
    return list;
  };
  
  const filteredOrders = getFilteredOrders().sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'status-pending', icon: Clock },
      confirmed: { label: 'Confirmed', className: 'status-confirmed', icon: CheckCircle2 },
      preparing: { label: 'Preparing', className: 'status-preparing', icon: ChefHat },
      ready: { label: 'Ready', className: 'status-ready', icon: TrendingUp },
      completed: { label: 'Completed', className: 'status-completed', icon: CheckCircle2 }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };
  
  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'completed'
    };
    return statusFlow[currentStatus];
  };
  
  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      pending: 'Confirm Order',
      confirmed: 'Start Preparing',
      preparing: 'Mark as Ready',
      ready: 'Complete Order'
    };
    return labels[currentStatus];
  };
  
  const orderCounts = {
    all: orders.length,
    active: orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length
  };
  
  return (
    <div className="space-y-6 page-transition">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Order Management</CardTitle>
          <div className="mt-3 flex flex-wrap gap-3 items-center">
            {filterStatus === 'completed' && (
              <div className="flex gap-3 items-end w-full md:w-auto">
                <div className="w-40">
                  <p className="text-xs text-muted-foreground mb-1">From</p>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="w-40">
                  <p className="text-xs text-muted-foreground mb-1">To</p>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <Tabs value={filterStatus} onValueChange={setFilterStatus} className="mb-6">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="all" className="relative">
                All Orders
                {orderCounts.all > 0 && (
                  <Badge className="ml-2 bg-muted text-muted-foreground">{orderCounts.all}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="relative">
                Active
                {orderCounts.active > 0 && (
                  <Badge className="ml-2 bg-primary">{orderCounts.active}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Pending
                {orderCounts.pending > 0 && (
                  <Badge className="ml-2 bg-warning text-muted-foreground">{orderCounts.pending}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed
                {orderCounts.completed > 0 && (
                  <Badge className="ml-2 bg-success text-muted-foreground">{orderCounts.completed}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Orders Grid */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ChefHat className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No orders found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => (
                <Card 
                  key={order.id} 
                  className={`card-interactive cursor-pointer ${
                    order.status === 'pending' ? 'pulse-glow border-warning' : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Table #{order.tableNumber}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(order.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Items: {order.items.length}</p>
                      <div className="flex flex-wrap gap-1">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {item.quantity}x {item.name}
                          </Badge>
                        ))}
                        {order.items.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{order.items.length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t flex items-center justify-between">
                      <span className="font-bold text-xl text-primary">{formatCurrency(order.total)}</span>
                      {order.status !== 'completed' ? (
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, getNextStatus(order.status));
                          }}
                          className="bg-primary"
                        >
                          {getNextStatusLabel(order.status)}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadInvoice(order);
                          }}
                        >
                          Download Invoice
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center justify-between">
                  <span>Order Details - Table #{selectedOrder.tableNumber}</span>
                  {getStatusBadge(selectedOrder.status)}
                </DialogTitle>
                <DialogDescription>
                  Order placed on {new Date(selectedOrder.timestamp).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Customer Info */}
                {(selectedOrder.customerName || selectedOrder.customerPhone) && (
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Customer Information</h4>
                    {selectedOrder.customerName && (
                      <p className="text-sm"><span className="text-muted-foreground">Name:</span> {selectedOrder.customerName}</p>
                    )}
                    {selectedOrder.customerPhone && (
                      <p className="text-sm"><span className="text-muted-foreground">Phone:</span> {selectedOrder.customerPhone}</p>
                    )}
                  </div>
                )}
                
                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Order Total */}
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between">
                      <span>GST ({(gstRate * 100).toFixed(0)}%)</span>
                    <span>{formatCurrency(selectedOrder.total * gstRate)}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total</span>
                    <span className="text-primary">{formatCurrency(selectedOrder.total * (1 + gstRate))}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {selectedOrder.status !== 'completed' ? (
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-primary"
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status));
                        setSelectedOrder(null);
                      }}
                    >
                      {getNextStatusLabel(selectedOrder.status)}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => downloadInvoice(selectedOrder)}
                    >
                      Download Invoice
                    </Button>
                    <Button 
                      className="flex-1 bg-primary"
                      onClick={() => setSelectedOrder(null)}
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersView;

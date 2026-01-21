import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { DollarSign, ShoppingBag, TrendingUp, CalendarRange } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Settings = () => {
  const { orders, gstRate, setGstRate } = useContext(AppContext);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [localGst, setLocalGst] = useState(gstRate);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  
  const filteredOrders = useMemo(() => {
    const fromMs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : -Infinity;
    const toMs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : Infinity;
    return orders
      .filter(o => {
        const t = new Date(o.timestamp).getTime();
        return t >= fromMs && t <= toMs;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [orders, fromDate, toDate]);
  
  const rangeTotals = useMemo(() => {
    const subtotal = filteredOrders.reduce((s, o) => s + o.total, 0);
    const gst = subtotal * gstRate;
    const grand = subtotal + gst;
    return { subtotal, gst, grand };
  }, [filteredOrders, gstRate]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const gstCollected = orders.reduce((sum, o) => sum + (o.total * gstRate), 0);
    const grandIncome = totalRevenue + gstCollected;
    return { totalOrders, completedOrders, activeOrders, totalRevenue, gstCollected, grandIncome };
  }, [orders, gstRate]);

  const handleGstUpdate = () => {
    const value = parseFloat(localGst);
    if (isNaN(value) || value < 0 || value > 1) {
      toast.error('Enter GST as a decimal between 0 and 1');
      return;
    }
    setGstRate(value);
    toast.success('GST rate updated');
  };

  const downloadRangeData = () => {
    const fromMs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : -Infinity;
    const toMs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : Infinity;
    const filtered = orders.filter(o => {
      const t = new Date(o.timestamp).getTime();
      return t >= fromMs && t <= toMs;
    });
    const rows = [
      ['Order ID','Table','Timestamp','Status','Subtotal','GST','Grand Total','Items'],
      ...filtered.map(o => {
        const gst = o.total * gstRate;
        const grand = o.total + gst;
        const items = o.items.map(i => `${i.name} x${i.quantity}`).join('; ');
        return [o.id, o.tableNumber, o.timestamp, o.status, o.total.toFixed(2), gst.toFixed(2), grand.toFixed(2), items];
      })
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roms-report-${fromDate || 'all'}-${toDate || 'all'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };
  
  const formatCurrency = (n) => `$${n.toFixed(2)}`;
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
    doc.text(`Subtotal: ${formatCurrency(order.total)}`, 14, endY + 10);
    doc.text(`GST (${(gstRate*100).toFixed(0)}%): ${formatCurrency(gst)}`, 14, endY + 16);
    doc.setFontSize(13);
    doc.text(`Grand Total: ${formatCurrency(grand)}`, 14, endY + 24);
    doc.save(`invoice-${order.id}.pdf`);
    toast.success(`Invoice PDF downloaded for Order #${order.id}`);
  };

  return (
    <div className="space-y-6 page-transition">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Settings & Configurations</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Manage business metadata and exports</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <div className="text-2xl font-bold mt-2">${stats.totalRevenue.toFixed(2)}</div>
              <Badge className="mt-2 bg-success/10 text-success border-success/20">GST ${stats.gstCollected.toFixed(2)}</Badge>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Grand Income</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold mt-2">${stats.grandIncome.toFixed(2)}</div>
              <Badge className="mt-2 bg-primary/10 text-primary border-primary/20">Incl. GST</Badge>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Orders</span>
                <ShoppingBag className="h-4 w-4 text-accent" />
              </div>
              <div className="text-2xl font-bold mt-2">{stats.totalOrders}</div>
              <div className="text-xs text-muted-foreground mt-1">Active {stats.activeOrders} • Completed {stats.completedOrders}</div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">GST Rate</p>
              <div className="flex items-end gap-3">
                <div className="w-40">
                  <Input type="number" step="0.01" min="0" max="1" value={localGst} onChange={(e) => setLocalGst(e.target.value)} />
                </div>
                <div className="text-sm">
                  <span className="font-semibold">{(parseFloat(localGst || 0) * 100).toFixed(0)}%</span>
                </div>
                <Button className="bg-primary" onClick={handleGstUpdate}>Update</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Enter as decimal (e.g., 0.05 = 5%)</p>
            </div>

            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Download Data</p>
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="w-40">
                  <p className="text-xs text-muted-foreground mb-1">From</p>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="w-40">
                  <p className="text-xs text-muted-foreground mb-1">To</p>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                <Button variant="outline" onClick={downloadRangeData}>Download Range CSV</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Exports include subtotal, GST, grand total, and items</p>
              
              <div className="mt-4 bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(rangeTotals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({(gstRate*100).toFixed(0)}%)</span>
                  <span className="font-medium">{formatCurrency(rangeTotals.gst)}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between font-bold">
                  <span>Grand Income</span>
                  <span className="text-primary">{formatCurrency(rangeTotals.grand)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Orders in Range</p>
              <div className="text-xs text-muted-foreground">
                Subtotal {formatCurrency(rangeTotals.subtotal)} • GST ({(gstRate*100).toFixed(0)}%) {formatCurrency(rangeTotals.gst)} • Grand {formatCurrency(rangeTotals.grand)}
              </div>
            </div>
            {filteredOrders.length === 0 ? (
              <div className="text-muted-foreground text-sm">No orders for selected dates</div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex-1">
                      <div className="font-medium">Order #{order.id} • Table #{order.tableNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.timestamp).toLocaleString()} • Items {order.items.length}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(order.total)}</div>
                      <div className="text-xs text-muted-foreground">GST {formatCurrency(order.total * gstRate)}</div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(order); setShowOrderDialog(true); }}>View</Button>
                      <Button variant="outline" size="sm" onClick={() => downloadInvoice(order)}>Invoice PDF</Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        const rows = [
                          ['Order ID','Table','Timestamp','Status','Subtotal','GST','Grand Total','Items'],
                          [
                            order.id,
                            order.tableNumber,
                            order.timestamp,
                            order.status,
                            order.total.toFixed(2),
                            (order.total * gstRate).toFixed(2),
                            (order.total * (1 + gstRate)).toFixed(2),
                            order.items.map(i => `${i.name} x${i.quantity}`).join('; ')
                          ]
                        ];
                        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `roms-order-${order.id}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast.success(`Order #${order.id} CSV downloaded`);
                      }}>Data CSV</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
            <DialogContent className="max-w-2xl">
              {selectedOrder && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Order #{selectedOrder.id} • Table #{selectedOrder.tableNumber}</DialogTitle>
                    <DialogDescription>{new Date(selectedOrder.timestamp).toLocaleString()}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
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
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-medium">{formatCurrency(selectedOrder.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST ({(gstRate*100).toFixed(0)}%)</span>
                        <span className="font-medium">{formatCurrency(selectedOrder.total * gstRate)}</span>
                      </div>
                      <div className="h-px bg-border my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Grand Total</span>
                        <span className="text-primary">{formatCurrency(selectedOrder.total * (1 + gstRate))}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => downloadInvoice(selectedOrder)}>Invoice PDF</Button>
                      <Button variant="outline" onClick={() => {
                        const rows = [
                          ['Order ID','Table','Timestamp','Status','Subtotal','GST','Grand Total','Items'],
                          [
                            selectedOrder.id,
                            selectedOrder.tableNumber,
                            selectedOrder.timestamp,
                            selectedOrder.status,
                            selectedOrder.total.toFixed(2),
                            (selectedOrder.total * gstRate).toFixed(2),
                            (selectedOrder.total * (1 + gstRate)).toFixed(2),
                            selectedOrder.items.map(i => `${i.name} x${i.quantity}`).join('; ')
                          ]
                        ];
                        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `roms-order-${selectedOrder.id}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast.success(`Order #${selectedOrder.id} CSV downloaded`);
                      }}>Data CSV</Button>
                      <Button className="bg-primary" onClick={() => setShowOrderDialog(false)}>Close</Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

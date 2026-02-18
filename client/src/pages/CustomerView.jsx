import React, { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Minus, Utensils, Coffee, IceCream, CreditCard, Smartphone, Banknote, CheckCircle2, Clock, ClipboardList } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

const CustomerView = () => {
  const { tableId } = useParams();
  const { orders, setOrders, menuItems, gstRate, setTables } = useContext(AppContext);
  
  const [orderStarted, setOrderStarted] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderStatus, setOrderStatus] = useState('browsing');
  const [sessionOrder, setSessionOrder] = useState(null);
  
  const categories = ['All', 'Appetizers', 'Main Course', 'Desserts', 'Beverages'];
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categoryIcons = {
    'Appetizers': Utensils,
    'Main Course': Utensils,
    'Desserts': IceCream,
    'Beverages': Coffee
  };
  
  const filteredMenu = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);
  
  const sessionBatches = sessionOrder ? [sessionOrder] : [];
  
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success(`${item.name} added to cart`);
  };
  
  const updateQuantity = (itemId, delta) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };
  
  const calculateCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const computeGrandSubtotal = () => sessionOrder ? sessionOrder.total : 0;
  const computeGrandGst = () => computeGrandSubtotal() * (gstRate || 0);
  const computeGrandTotal = () => computeGrandSubtotal() + computeGrandGst();
  
  const occupyTable = async () => {
    try {
      const num = parseInt(tableId, 10);
      if (!Number.isInteger(num) || num <= 0) {
        return;
      }
      await axios.patch(`/api/tables/number/${num}/status`, { status: 'occupied' });
      const res = await axios.get('/api/tables');
      const data = res?.data ?? [];
      setTables((data || []).map(t => ({ id: t._id || t.id, ...t })));
    } catch {}
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    try {
      const payload = {
        tableNumber: parseInt(tableId, 10),
        items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
        customerName: customerDetails.name || 'Guest',
        customerPhone: customerDetails.phone || ''
      };
      const res = await axios.post('/api/orders', payload);
      const updated = res?.data;
      if (!updated) {
        toast.error('Failed to place order');
        return;
      }
      const id = updated._id || updated.id;
      setSessionOrder({ id, ...updated });
      
      // Update local orders state
      const existingIdx = orders.findIndex(o => (o._id || o.id) === id);
      if (existingIdx >= 0) {
        const newOrders = [...orders];
        newOrders[existingIdx] = { id, ...updated };
        setOrders(newOrders);
      } else {
        setOrders([...orders, { id, ...updated }]);
      }

      setOrderStatus('ordered');
      setShowCart(false);
      setCart([]);
      toast.success('Order placed. Waiting for confirmation...');
    } catch {
      toast.error('Failed to place order');
    }
  };

  const finishOrder = () => {
    if (!sessionOrder) {
      toast.error('Place at least one order');
      return;
    }
    setShowCheckout(true);
  };
  
  const generateInvoicePdf = () => {
    if (!sessionOrder) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Invoice - Table #${tableId}`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 28);
    const rows = [];
    sessionOrder.items.forEach((it, idx) => {
      rows.push([
        `#${idx + 1}`,
        it.name,
        it.quantity,
        `$${it.price.toFixed(2)}`,
        `$${(it.price * it.quantity).toFixed(2)}`,
        it.status.charAt(0).toUpperCase() + it.status.slice(1)
      ]);
    });
    autoTable(doc, {
      head: [['#', 'Item', 'Qty', 'Price', 'Subtotal', 'Status']],
      body: rows,
      startY: 36
    });
    const subtotal = computeGrandSubtotal();
    const tax = computeGrandGst();
    const total = computeGrandTotal();
    const y = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 14, y);
    doc.text(`GST (${(gstRate*100).toFixed(0)}%): $${tax.toFixed(2)}`, 14, y + 6);
    doc.text(`Total: $${total.toFixed(2)}`, 14, y + 12);
    doc.save(`invoice_table_${tableId}_${Date.now()}.pdf`);
  };

  const processPayment = async () => {
    if (!customerDetails.name) {
      toast.error('Please enter your name');
      return;
    }
    
    generateInvoicePdf();
    try {
      if (sessionOrder) {
        await axios.patch(`/api/orders/${sessionOrder.id}/status`, { status: 'completed' });
        const ordersRes = await axios.get('/api/orders');
        const latest = ordersRes?.data ?? [];
        setOrders((latest || []).map(o => ({ id: o._id || o.id, ...o })));
        const num = parseInt(tableId, 10);
        await axios.patch(`/api/tables/number/${num}/status`, { status: 'available' });
        const tablesRes = await axios.get('/api/tables');
        const latestTables = tablesRes?.data ?? [];
        setTables((latestTables || []).map(t => ({ id: t._id || t.id, ...t })));
      }
    } catch {}
    setShowCheckout(false);
    setShowBill(false);
    setOrderStatus('browsing');
    setSessionOrder(null);
    setCart([]);
    setCustomerDetails({ name: '', phone: '' });
    setPaymentMethod('card');
    setOrderStarted(false);
    toast.success('Payment successful. Invoice downloaded.');
  };
  
  const getStatusDisplay = () => {
    const active = sessionOrder || [...orders].reverse().find(o => o.tableNumber === parseInt(tableId, 10) && o.status !== 'completed');
    const preparedCount = active?.items?.filter(it => it.status === 'prepared').length || 0;
    if (preparedCount > 0 && active?.status !== 'completed') {
      return { text: `${preparedCount} item(s) serving soon`, color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 };
    }
    const statusConfig = {
      browsing: { text: 'Browse Menu', color: 'bg-muted text-muted-foreground', icon: Utensils },
      ordered: { text: 'Order Placed - Waiting for Kitchen', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
      pending: { text: 'Order Placed - Waiting for Kitchen', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
      preparing: { text: 'Kitchen is Preparing Your Order', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Utensils },
      ready: { text: 'Order Ready - Please proceed to pay', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
      completed: { text: 'Order Completed', color: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2 }
    };
    return statusConfig[orderStatus] || statusConfig[active?.status] || statusConfig.browsing;
  };

  React.useEffect(() => {
    const active = [...orders].reverse().find(o => o.tableNumber === parseInt(tableId, 10) && o.status !== 'completed');
    if (!active) {
       // Only clear if we really don't have an active order on server
       if (sessionOrder && sessionOrder.status === 'completed') {
          setSessionOrder(null);
       }
       return;
    }
    
    // Sync sessionOrder with server state
    if (!sessionOrder || sessionOrder.id !== active.id || sessionOrder.items.length !== active.items.length || sessionOrder.status !== active.status) {
       setSessionOrder(active);
    }

    const anyPrepared = active.items && active.items.some(it => it.status === 'prepared');
    if (active.status === 'pending' || active.status === 'confirmed') {
      setOrderStatus(anyPrepared ? 'preparing' : 'ordered');
    } else if (active.status === 'preparing') {
      setOrderStatus('preparing');
    } else if (active.status === 'ready') {
      setOrderStatus('ready');
    } else if (active.status === 'completed') {
      setOrderStatus('completed');
    }
  }, [orders, tableId]);
  
  // Removed old sessionBatches sync effect

  
  const StatusIcon = getStatusDisplay().icon;
  
  if (!orderStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Utensils className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome</h1>
              <p className="text-muted-foreground text-lg">Table #{tableId}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 text-center space-y-2">
              <h3 className="font-semibold text-lg">Order from Your Table</h3>
              <p className="text-sm text-muted-foreground">
                Browse our menu, place orders, and pay - all from this device
              </p>
            </div>
            <Button 
              onClick={() => { occupyTable(); setOrderStarted(true); }} 
              className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all"
              size="lg"
            >
              Start Ordering
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Table #{tableId}</h1>
              <p className="text-sm text-muted-foreground">Select items from our menu</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowCart(true)} 
                variant="outline" 
                className="relative h-12 px-6"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Cart
                {cart.length > 0 && (
                  <Badge className="ml-2 bg-primary">{cart.length}</Badge>
                )}
              </Button>
              {sessionBatches.length > 0 && (
                <Button 
                  onClick={finishOrder}
                  className="h-12 px-6 bg-primary"
                >
                  Finish & Get Bill
                </Button>
              )}
            </div>
          </div>
          
          {/* Navigation */}
          {orderStatus !== 'browsing' && (
            <div className={`mt-4 p-4 rounded-lg border flex items-center gap-3 ${getStatusDisplay().color}`}>
              <StatusIcon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{getStatusDisplay().text}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Batches */}
      {sessionBatches.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-5 w-5" />
              <span className="font-semibold">Your Orders</span>
            </div>
            <div className="space-y-4">
              {sessionBatches.map((b, idx) => (
                <div key={b.id} className="rounded-md border">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">Batch #{idx + 1}</Badge>
                      <span className="text-muted-foreground">{new Date(b.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">${b.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="p-3 space-y-2">
                    {b.items.map((it, iIdx) => (
                      <div key={iIdx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{it.quantity}x {it.name}</span>
                          <span className="text-muted-foreground">${(it.price * it.quantity).toFixed(2)}</span>
                        </div>
                        <Badge className={
                          it.status === 'pending' ? 'bg-warning' :
                          it.status === 'prepared' ? 'bg-blue-500' :
                          'bg-success'
                        }>
                          {it.status.charAt(0).toUpperCase() + it.status.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <div className="text-sm text-muted-foreground">
                  Subtotal: <span className="font-medium">${computeGrandSubtotal().toFixed(2)}</span> • GST ({(gstRate*100).toFixed(0)}%): <span className="font-medium">${computeGrandGst().toFixed(2)}</span> • Total: <span className="font-bold text-primary">${computeGrandTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Menu Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto h-auto p-1">
            {categories.map(category => {
              const Icon = categoryIcons[category] || Utensils;
              return (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{category}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        
        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {filteredMenu.map(item => (
            <Card key={item.id} className="overflow-hidden card-interactive">
              <div className="aspect-video relative overflow-hidden bg-muted">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                ) : null}
                {item.vegetarian && (
                  <Badge className="absolute top-2 right-2 bg-success">
                    Veg
                  </Badge>
                )}
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg leading-tight">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="flex items-center justify-between pt-0">
                <span className="text-xl font-bold text-primary">${item.price.toFixed(2)}</span>
                <Button 
                  onClick={() => addToCart(item)} 
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Floating Action Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            onClick={() => setShowCart(true)} 
            size="lg"
            className="h-16 px-8 rounded-full shadow-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all"
          >
            <ShoppingCart className="mr-2 h-6 w-6" />
            View Cart ({cart.length})
          </Button>
        </div>
      )}
      
      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Your Order</DialogTitle>
            <DialogDescription>Review your items before placing the order</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                  <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {cart.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Subtotal</span>
                  <span>${calculateCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">GST ({(gstRate*100).toFixed(0)}%)</span>
                  <span>${(calculateCartTotal() * (gstRate || 0)).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary">${(calculateCartTotal() * (1 + (gstRate || 0))).toFixed(2)}</span>
                </div>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShowCart(false)}>Continue Ordering</Button>
                <Button onClick={placeOrder} className="bg-primary">Place Order</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Complete Your Order</DialogTitle>
            <DialogDescription>Enter your details and choose payment method</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input 
                  id="name"
                  placeholder="Enter your name"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input 
                  id="phone"
                  placeholder="Enter your phone number"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                  className="mt-1.5"
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <Label className="mb-3 block">Payment Method</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-4"
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="h-6 w-6 mb-2" />
                  <span className="text-xs">Card</span>
                </Button>
                <Button
                  variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-4"
                  onClick={() => setPaymentMethod('upi')}
                >
                  <Smartphone className="h-6 w-6 mb-2" />
                  <span className="text-xs">UPI</span>
                </Button>
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-4"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Banknote className="h-6 w-6 mb-2" />
                  <span className="text-xs">Cash</span>
                </Button>
              </div>
            </div>
            
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Total Amount</span>
                <span className="font-bold text-lg text-primary">${computeGrandTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>Cancel</Button>
            <Button onClick={processPayment} className="bg-primary">Pay Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bill Dialog */}
      <Dialog open={showBill} onOpenChange={setShowBill}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <DialogTitle className="text-2xl">Payment Successful!</DialogTitle>
              <DialogDescription>Thank you for dining with us</DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-6">
            <div className="bg-muted rounded-lg p-6 space-y-3">
              <div className="text-center pb-3 border-b border-border">
                <h3 className="font-bold text-lg">Bill Summary</h3>
                <p className="text-sm text-muted-foreground">Table #{tableId}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${computeGrandSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST ({(gstRate*100).toFixed(0)}%)</span>
                  <span>${computeGrandGst().toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Paid</span>
                  <span className="text-primary">${computeGrandTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="capitalize font-medium">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{customerDetails.name}</span>
                </div>
                {customerDetails.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{customerDetails.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-center text-sm text-muted-foreground">
              Show this confirmation at the counter before leaving
            </p>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowBill(false)} className="w-full">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerView;

import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { QrCode, Users, Circle } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import axios from 'axios';

const TableManagement = () => {
  const { tables, orders, setTables } = useContext(AppContext);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [baseURL, setBaseURL] = useState();
  const [showAdd, setShowAdd] = useState(false);
  const [formNumber, setFormNumber] = useState('');
  const [formCapacity, setFormCapacity] = useState('2');

  const generateQRCode = async (tableNumber) => {
    try {
      const url = `${window.location.origin}/table/${tableNumber}`;
      setBaseURL(url);
      console.log("Url:", url);
      const qrUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#D96B2A',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
      setSelectedTable(tables.find(t => t.number === tableNumber));
      setShowQR(true);
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `table-${selectedTable.number}-qr.png`;
    link.click();
    toast.success('QR Code downloaded');
  };

  const triggerQRUrl = () => {
    window.location.href = baseURL;
  };


  const getTableStatus = (table) => {
    if (table.status === 'reserved' || table.status === 'occupied') return table.status;
    const hasActiveOrder = orders.some(
      order => order.tableNumber === table.number &&
        ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
    );
    return hasActiveOrder ? 'occupied' : 'available';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'text-success bg-success/10 border-success/20';
      case 'occupied':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'reserved':
        return 'text-blue-600 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getStatusIcon = (status) => {
    return <Circle className="h-2 w-2 fill-current" />;
  };

  const tableStats = {
    total: tables.length,
    available: tables.filter(t => getTableStatus(t) === 'available').length,
    occupied: tables.filter(t => getTableStatus(t) === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length
  };

  const addTable = async () => {
    const number = parseInt(formNumber, 10);
    const capacity = parseInt(formCapacity, 10);
    if (!Number.isInteger(number) || number <= 0) {
      toast.error('Enter a valid table number');
      return;
    }
    if (!Number.isInteger(capacity) || capacity <= 0) {
      toast.error('Enter a valid capacity');
      return;
    }
    if (tables.some(t => t.number === number)) {
      toast.error('Table number already exists');
      return;
    }
    try {
      const { data: created } = await axios.post('/api/tables', { number, capacity });
      const newTable = { id: created._id || created.id, ...created };
      setTables([...tables, newTable]);
      toast.success('Table added');
    } catch {
      toast.error('Failed to add table');
    }
    setShowAdd(false);
    setFormNumber('');
    setFormCapacity('2');
  };

  const removeTable = async (table) => {
    try {
      await axios.delete(`/api/tables/${table.id}`);
      setTables(tables.filter(t => t.id !== table.id));
      toast.success('Table removed');
    } catch {
      toast.error('Failed to remove table');
    }
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tableStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{tableStats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{tableStats.occupied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Reserved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{tableStats.reserved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Table Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">View and manage restaurant tables with QR codes</p>
            </div>
            <Button onClick={() => setShowAdd(true)} className="bg-primary">
              Add Table
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {tables.map(table => {
              const status = getTableStatus(table);
              return (
                <Card
                  key={table.id}
                  className={`card-interactive cursor-pointer ${status === 'occupied' ? 'border-warning' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Table {table.number}</CardTitle>
                      <Badge className={`${getStatusColor(status)} flex items-center gap-1`}>
                        {getStatusIcon(status)}
                        <span className="text-xs capitalize">{status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      Capacity: {table.capacity}
                    </div>
                    <Button
                      className="w-full bg-primary"
                      size="sm"
                      onClick={() => generateQRCode(table.number)}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      View QR
                    </Button>
                    <Button
                      className="w-full"
                      size="sm"
                      variant="outline"
                      onClick={() => removeTable(table)}
                    >
                      Remove Table
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Table Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md w-[90vw] sm:w-auto">
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
            <DialogDescription>Enter details to create a new table</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="table-number">Table Number</Label>
              <Input id="table-number" type="number" value={formNumber} onChange={(e) => setFormNumber(e.target.value)} placeholder="e.g. 12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-capacity">Capacity</Label>
              <Input id="table-capacity" type="number" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} placeholder="e.g. 4" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button className="bg-primary" onClick={addTable}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-md w-[90vw] sm:w-auto max-h-[95vh]">
          {selectedTable && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-center">Table {selectedTable.number} QR Code</DialogTitle>
                <DialogDescription className="text-center">
                  Scan this code to access the table menu
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-muted/50 to-muted rounded-2xl p-4 flex items-center justify-center">
                  {qrCodeUrl && (
                    <img src={qrCodeUrl} alt="QR Code" onClick={triggerQRUrl} className="w-full max-w-[200px] rounded-lg shadow-lg" />
                  )}
                </div>

                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <Link href={baseURL} className="text-muted-foreground block">Base QR Link</Link> <br />
                    <span className="text-muted-foreground">Table Number</span>
                    <span className="font-semibold">#{selectedTable.number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-semibold">{selectedTable.capacity} persons</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={getStatusColor(getTableStatus(selectedTable))}>
                      {getTableStatus(selectedTable)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button onClick={downloadQRCode} className="w-full bg-primary">
                    Download QR Code
                  </Button>
                  <Button onClick={() => setShowQR(false)} variant="outline" className="w-full">
                    Close
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Place this QR code on the table for customers to scan and order
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableManagement;

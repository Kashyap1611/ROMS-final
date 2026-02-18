import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, UtensilsCrossed } from 'lucide-react';
import axios from 'axios';

const MenuManagement = () => {
  const { menuItems, setMenuItems } = useContext(AppContext);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    image: '',
    available: true,
    vegetarian: false
  });
  const [filterCategory, setFilterCategory] = useState('All');
  
  const categories = ['Appetizers', 'Main Course', 'Desserts', 'Beverages'];
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Main Course',
      image: '',
      available: true,
      vegetarian: false
    });
    setEditingItem(null);
  };
  
  const openAddDialog = () => {
    resetForm();
    setShowDialog(true);
  };
  
  const openEditDialog = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image: item.image,
      available: item.available,
      vegetarian: item.vegetarian
    });
    setShowDialog(true);
  };
  
  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const itemData = {
      ...formData,
      price: parseFloat(formData.price),
      image: formData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
    };
    
    try {
      if (editingItem) {
        const { data: updatedItem } = await axios.put(`/api/menu/${editingItem.id}`, itemData);
        // Ensure id property exists for frontend compatibility
        const normalizedItem = { id: updatedItem._id, ...updatedItem };
        
        setMenuItems(menuItems.map(item => 
          item.id === editingItem.id ? normalizedItem : item
        ));
        toast.success('Menu item updated successfully');
      } else {
        const { data: newItem } = await axios.post('/api/menu', itemData);
        // Ensure id property exists for frontend compatibility
        const normalizedItem = { id: newItem._id, ...newItem };
        
        setMenuItems([...menuItems, normalizedItem]);
        toast.success('Menu item added successfully');
      }
      
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error(error.message);
    }
  };
  
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/menu/${id}`);
      
      setMenuItems(menuItems.filter(item => item.id !== id));
      toast.success('Menu item deleted');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    }
  };
  
  const toggleAvailability = async (id) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    
    try {
      const { data: updatedItem } = await axios.put(`/api/menu/${id}`, { available: !item.available });
      const normalizedItem = { id: updatedItem._id, ...updatedItem };
      
      setMenuItems(menuItems.map(i => 
        i.id === id ? normalizedItem : i
      ));
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };
  
  const filteredItems = filterCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === filterCategory);
  
  return (
    <div className="space-y-6 page-transition">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Menu Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Manage your restaurant menu items</p>
            </div>
            <Button onClick={openAddDialog} className="bg-primary">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <Button
              variant={filterCategory === 'All' ? 'default' : 'outline'}
              onClick={() => setFilterCategory('All')}
              size="sm"
            >
              All ({menuItems.length})
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={filterCategory === category ? 'default' : 'outline'}
                onClick={() => setFilterCategory(category)}
                size="sm"
              >
                {category} ({menuItems.filter(i => i.category === category).length})
              </Button>
            ))}
          </div>
          
          {/* Menu Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No menu items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <Card key={item.id} className="overflow-hidden card-interactive">
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    <div className="absolute top-2 right-2 flex gap-2">
                      {item.vegetarian && (
                        <Badge className="bg-success">Veg</Badge>
                      )}
                      <Badge className={item.available ? 'bg-success' : 'bg-destructive'}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{item.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">{item.category}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.description}</p>
                  </CardHeader>
                  <CardFooter className="flex items-center justify-between pt-0">
                    <span className="text-xl font-bold text-primary">${item.price.toFixed(2)}</span>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => toggleAvailability(item.id)}
                      >
                        <Switch checked={item.available} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Margherita Pizza"
                  className="mt-1.5"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the item"
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="0.00"
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty for default image</p>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <Label htmlFor="available" className="cursor-pointer">
                  <div className="font-medium">Available</div>
                  <p className="text-sm text-muted-foreground">Item is available for ordering</p>
                </Label>
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => setFormData({...formData, available: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <Label htmlFor="vegetarian" className="cursor-pointer">
                  <div className="font-medium">Vegetarian</div>
                  <p className="text-sm text-muted-foreground">Mark as vegetarian</p>
                </Label>
                <Switch
                  id="vegetarian"
                  checked={formData.vegetarian}
                  onCheckedChange={(checked) => setFormData({...formData, vegetarian: checked})}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-primary">
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagement;

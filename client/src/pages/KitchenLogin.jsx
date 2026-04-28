import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const KitchenLogin = () => {
  const navigate = useNavigate();
  const { loginKitchen } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      toast.error('Enter email and password');
      return;
    }
    setLoading(true);
    const success = await loginKitchen(email, password);
    setLoading(false);
    
    if (success) {
      toast.success('Kitchen Login successful');
      navigate('/kitchen/dashboard', { replace: true });
    } else {
      toast.error('Invalid kitchen credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background page-transition">
      <Card className="w-[90vw] max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-3">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Kitchen Login</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Access the kitchen display system</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Kitchen Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="kitchen@roms.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onLogin()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onLogin()}
            />
          </div>
          <Button className="w-full bg-primary" onClick={onLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Login to Kitchen'}
          </Button>
          <div className="text-center">
            <Button variant="link" size="sm" onClick={() => navigate('/login')} className="text-muted-foreground">
              Manager Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KitchenLogin;
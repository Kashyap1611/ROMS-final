import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';

const CreateManagerTemp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      toast.error('Enter email and password');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/manager/create', { email, password });
      toast.success('Manager created');
      setEmail('');
      setPassword('');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to create manager';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <Card className="w-[90vw] max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create Manager (Temp)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="manager@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
          </div>
          <Button className="bg-primary w-full" onClick={onSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateManagerTemp;

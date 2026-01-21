import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

const ManagerLogin = () => {
  const navigate = useNavigate();
  const { loginManager } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const onLogin = async () => {
    if (!email || !password) {
      toast.error('Enter email and password');
      return;
    }
    setLoading(true);
    const ok = await loginManager(email, password);
    setLoading(false);
    if (!ok) {
      toast.error('Invalid credentials');
      return;
    }
    toast.success('Login successful');
    navigate('/manager/dashboard', { replace: true });
  };

  const resetState = () => {
    setStep(1);
    setOtp('');
    setNewPassword('');
    setForgotEmail('');
    setShowForgot(false);
  };

  const sendReset = async () => {
    if (!forgotEmail) {
      toast.error('Enter your email');
      return;
    }
    try {
      const res = await fetch('/api/manager/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to send OTP');
        return;
      }
      toast.success('OTP sent to email');
      setStep(2);
    } catch {
      toast.error('Error sending OTP');
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      toast.error('Enter OTP');
      return;
    }
    try {
      const res = await fetch('/api/manager/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp })
      });
      if (!res.ok) {
        toast.error('Invalid OTP');
        return;
      }
      toast.success('OTP verified');
      setStep(3);
    } catch {
      toast.error('Error verifying OTP');
    }
  };

  const resetPassword = async () => {
    if (!newPassword) {
      toast.error('Enter new password');
      return;
    }
    try {
      const res = await fetch('/api/manager/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp, newPassword })
      });
      if (!res.ok) {
        toast.error('Failed to reset password');
        return;
      }
      toast.success('Password reset successful. Please login.');
      resetState();
    } catch {
      toast.error('Error resetting password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background page-transition">
      <Card className="w-[90vw] max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-3">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Manager Login</CardTitle>
          <p className="text-sm text-muted-foreground">Access the restaurant dashboard</p>
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
          <div className="flex items-center justify-between">
            <Button className="bg-primary" onClick={onLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForgot(true)}>Forgot password?</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForgot} onOpenChange={(open) => {
        if (!open) resetState();
        else setShowForgot(true);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {step === 1 && 'Enter your email to receive OTP'}
              {step === 2 && 'Enter the OTP sent to your email'}
              {step === 3 && 'Enter your new password'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {step === 1 && (
              <>
                <Label htmlFor="forgot-email">Email</Label>
                <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="manager@example.com" />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetState}>Cancel</Button>
                  <Button className="bg-primary" onClick={sendReset}>Send OTP</Button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <Label htmlFor="otp">OTP</Label>
                <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button className="bg-primary" onClick={verifyOtp}>Verify OTP</Button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetState}>Cancel</Button>
                  <Button className="bg-primary" onClick={resetPassword}>Reset Password</Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerLogin;

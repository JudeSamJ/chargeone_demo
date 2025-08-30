
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function RechargeDialog({ isOpen, onOpenChange, onRecharge, razorpayKeyId }) {
  const [amount, setAmount] = useState('');
  const { toast } = useToast();
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  useEffect(() => {
    const scriptId = 'razorpay-checkout-js';
    if (document.getElementById(scriptId) || window.Razorpay) {
      setIsRazorpayLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setIsRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error('Razorpay script failed to load.');
      setIsRazorpayLoaded(false);
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: 'Could not load the payment gateway. Please check your connection and try again.',
      });
    };

    document.body.appendChild(script);

    return () => {
      const scriptElement = document.getElementById(scriptId);
      if (scriptElement) {
        document.body.removeChild(scriptElement);
      }
    };
  }, [toast]);

  const handleRechargeClick = () => {
    const rechargeAmount = parseFloat(amount);
    if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to recharge.',
      });
      return;
    }

    if (!isRazorpayLoaded || !window.Razorpay) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Payment gateway is not ready yet. Please try again in a moment.',
      });
      return;
    }

    const options = {
      key: razorpayKeyId,
      amount: rechargeAmount * 100,
      currency: 'INR',
      name: 'ChargeOne Wallet',
      description: 'Recharge your wallet',
      image: 'https://placehold.co/100x100.png',
      handler: () => {
        onRecharge(rechargeAmount);
        setAmount('');
        onOpenChange(false);
      },
      prefill: {
        contact: '9000000000',
        email: 'guest@chargeone.com',
        name: 'Guest User',
      },
      notes: {
        address: 'ChargeOne Corporate Office',
      },
      theme: {
        color: '#1976D2',
      },
    };

    try {
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', (response) => {
        console.error('Razorpay Payment Failed:', response.error);
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: response.error.description || 'An unknown error occurred.',
        });
        onOpenChange(false);
      });
      rzp1.open();
    } catch (error) {
      console.error('Error initializing Razorpay', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not initialize payment flow. Please try again.',
      });
    }
  };

  const quickAmounts = [500, 1000, 2000];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recharge Wallet</DialogTitle>
          <DialogDescription>Add funds to your wallet using Razorpay.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((qAmount) => (
              <Button key={qAmount} variant="outline" onClick={() => setAmount(qAmount.toString())}>
                ₹{qAmount}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1500"
              className="col-span-3"
            />
          </div>
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted">
            <img
              src="https://razorpay.com/assets/razorpay-logo.svg"
              alt="Razorpay"
              className="h-8 mb-2"
            />
            <p className="text-sm text-muted-foreground">Secure Payments</p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleRechargeClick}
            className="w-full"
            disabled={!isRazorpayLoaded || !razorpayKeyId || !amount || parseFloat(amount) <= 0}
          >
            Recharge with Razorpay
          </Button>
          {!razorpayKeyId && (
            <p className="text-xs text-destructive text-center w-full">
              Razorpay Key ID not configured.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

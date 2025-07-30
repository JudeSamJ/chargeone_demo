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
import { useRazorpay } from '@/hooks/useRazorpay';

interface RechargeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRecharge: (amount: number) => void;
  razorpayKeyId?: string;
}

export default function RechargeDialog({ isOpen, onOpenChange, onRecharge, razorpayKeyId }: RechargeDialogProps) {
  const [amount, setAmount] = useState('');
  const { toast } = useToast();
  const [Razorpay, isLoaded] = useRazorpay();

  useEffect(() => {
    // This effect can be used to pre-load the script if needed,
    // although the hook handles loading on first use.
  }, [isOpen]);

  const handleRechargeClick = () => {
    const rechargeAmount = parseFloat(amount);
    if (!razorpayKeyId || isNaN(rechargeAmount) || rechargeAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to recharge.",
      });
      return;
    }

    if (!isLoaded || !Razorpay) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Razorpay script not loaded yet. Please try again in a moment.",
        });
        return;
    }

    const options = {
      key: razorpayKeyId,
      amount: rechargeAmount * 100, // Amount in paisa
      currency: "INR",
      name: "ChargeOne Wallet",
      description: "Recharge your wallet",
      image: "https://placehold.co/100x100.png", // Replace with your logo
      handler: function (response: any) {
        onRecharge(rechargeAmount);
        setAmount('');
        onOpenChange(false);
      },
      prefill: {
        name: "Test User",
        email: "test.user@example.com",
        contact: "9999999999"
      },
      notes: {
        address: "ChargeOne Corporate Office"
      },
      theme: {
        color: "#3399cc"
      }
    };
    
    try {
        const rzp1 = new Razorpay(options);
        rzp1.on('payment.failed', function (response: any){
            if (response.error && response.error.description) {
               toast({
                   variant: "destructive",
                   title: "Payment Failed",
                   description: response.error.description,
               });
            }
        });
        rzp1.open();
    } catch (error) {
        console.error("Error initializing Razorpay", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not initialize payment flow. Please try again.",
        });
    }
  };

  const quickAmounts = [500, 1000, 2000];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recharge Wallet</DialogTitle>
          <DialogDescription>
            Add funds to your wallet using Razorpay.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map(qAmount => (
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
              <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="h-8 mb-2" />
              <p className="text-sm text-muted-foreground">Secure Payments</p>
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleRechargeClick} 
            className="w-full" 
            disabled={!isLoaded || !razorpayKeyId || parseFloat(amount) <= 0 || isNaN(parseFloat(amount))}
          >
            Recharge with Razorpay
          </Button>
          {!razorpayKeyId && <p className="text-xs text-destructive text-center w-full">Razorpay Key ID not configured.</p>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

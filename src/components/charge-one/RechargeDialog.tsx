"use client";

import { useState } from 'react';
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

interface RechargeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRecharge: (amount: number) => void;
}

export default function RechargeDialog({ isOpen, onOpenChange, onRecharge }: RechargeDialogProps) {
  const [amount, setAmount] = useState('');

  const handleRechargeClick = () => {
    const rechargeAmount = parseFloat(amount);
    if (!isNaN(rechargeAmount) && rechargeAmount > 0) {
      // In a real integration, you would use the public Razorpay key ID here
      // to initialize the checkout process on the client-side.
      console.log("Using Razorpay Key ID:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
      onRecharge(rechargeAmount);
      setAmount('');
    }
  };

  const quickAmounts = [500, 1000, 2000];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recharge Wallet</DialogTitle>
          <DialogDescription>
            Add funds to your wallet. This is a simulated payment.
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
              <p className="text-sm text-muted-foreground">Simulated Payment</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleRechargeClick} className="w-full">
            Recharge with Razorpay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

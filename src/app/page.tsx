
"use client";

import { useState, Suspense, useEffect } from 'react';
import type { Station, Vehicle } from '@/lib/types';
import { defaultVehicle, vehicles } from '@/lib/mock-data';
import Header from '@/components/charge-one/Header';
import WalletCard from '@/components/charge-one/WalletCard';
import VehicleStatusCard from '@/components/charge-one/VehicleStatusCard';
import ChargingSession from '@/components/charge-one/ChargingSession';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import RechargeDialog from '@/components/charge-one/RechargeDialog';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { rechargeWallet } from '@/ai/flows/rechargeWallet';

function HomePageContent() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [userVehicle, setUserVehicle] = useState<Vehicle | null>(null);


  const { toast } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('guest') === 'true';

  useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push('/login');
    } else if (!loading && (user || isGuest)) {
      const storedVehicle = localStorage.getItem('userVehicle');
      if (storedVehicle) {
        setUserVehicle(JSON.parse(storedVehicle));
      } else if(isGuest) {
        // For guests, use a default vehicle so they can use the app
        const guestVehicle = { ...defaultVehicle, currentCharge: 80 };
        setUserVehicle(guestVehicle);
        // Also save it so it persists if they refresh
        localStorage.setItem('userVehicle', JSON.stringify(guestVehicle));
      }
      else if (user) {
        // If logged in but no vehicle, go to selection
        router.push('/vehicle-details');
      }
    }
  }, [user, loading, router, isGuest]);

  const handleEndSession = (cost: number) => {
    setWalletBalance((prev) => prev - cost);
    setSelectedStation(null);
  };
  
  const handleClearSelection = () => {
    setSelectedStation(null);
  }

  const handleRecharge = async (amount: number) => {
    try {
      const result = await rechargeWallet({ amount });
      if (result.success) {
        setWalletBalance((prev) => prev + amount);
        setIsRechargeOpen(false);
        toast({
          title: "Recharge Successful",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Recharge Failed",
          description: result.message,
        });
      }
    } catch (error) {
       toast({
          variant: "destructive",
          title: "Recharge Error",
          description: "An unexpected error occurred.",
        });
    }
  }

  if (loading || (!user && !isGuest) || !userVehicle) {
    return (
        <div className="min-h-screen bg-background">
             <Header />
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className="lg:col-span-1 flex flex-col gap-8">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                    <div className="lg:col-span-2">
                         <Skeleton className="h-[400px] w-full" />
                    </div>
                </div>
            </main>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <WalletCard balance={walletBalance} onRecharge={() => setIsRechargeOpen(true)} />
            <VehicleStatusCard vehicle={userVehicle} />
          </div>
            {selectedStation && (
                <ChargingSession
                station={selectedStation}
                onEndSession={handleEndSession}
                onClearSelection={handleClearSelection}
                vehicle={userVehicle}
                />
            )}
            {!selectedStation && (
              <div className="text-center p-12 bg-muted rounded-lg">
                <h2 className="text-2xl font-bold">Welcome to ChargeOne</h2>
                <p className="text-muted-foreground mt-2">Map functionality is temporarily disabled. Please use the sidebar to manage your account.</p>
              </div>
            )}
        </div>
      </main>
      <RechargeDialog 
        isOpen={isRechargeOpen}
        onOpenChange={setIsRechargeOpen}
        onRecharge={handleRecharge}
        razorpayKeyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}
      />
      <Toaster />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-background"><p>Loading...</p></div>}>
      <HomePageContent />
    </Suspense>
  )
}

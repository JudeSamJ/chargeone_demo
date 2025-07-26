"use client";

import { useState, Suspense } from 'react';
import type { Station } from '@/lib/types';
import { availableStations, userVehicle } from '@/lib/mock-data';
import Header from '@/components/charge-one/Header';
import WalletCard from '@/components/charge-one/WalletCard';
import VehicleStatusCard from '@/components/charge-one/VehicleStatusCard';
import MapView from '@/components/charge-one/MapView';
import ChargingSession from '@/components/charge-one/ChargingSession';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import RechargeDialog from '@/components/charge-one/RechargeDialog';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { rechargeWallet } from '@/ai/flows/rechargeWallet';

function HomePageContent() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('guest') === 'true';

  useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, loading, router, isGuest]);


  const handleSelectStation = (station: Station) => {
    if (walletBalance <= 0) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "Please recharge your wallet to start a session.",
      });
      setIsRechargeOpen(true);
      return;
    }
    if (station.isAvailable) {
      setSelectedStation(station);
    } else {
      toast({
        variant: "destructive",
        title: "Station Unavailable",
        description: "This charging station is currently in use.",
      });
    }
  };

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
  
  if (loading || (!user && !isGuest)) {
    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
             <Header />
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                    <div className="lg:col-span-3">
                         <Skeleton className="h-[600px] w-full" />
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <WalletCard balance={walletBalance} onRecharge={() => setIsRechargeOpen(true)} />
            <VehicleStatusCard vehicle={userVehicle} />
            <MapView 
              stations={availableStations}
              onSelectStation={handleSelectStation}
              selectedStationId={selectedStation?.id}
            />
          </div>
          <div className="lg:col-span-3">
            <ChargingSession
              station={selectedStation}
              onEndSession={handleEndSession}
              onClearSelection={handleClearSelection}
              vehicle={userVehicle}
            />
          </div>
        </div>
      </main>
      <RechargeDialog 
        isOpen={isRechargeOpen}
        onOpenChange={setIsRechargeOpen}
        onRecharge={handleRecharge}
      />
      <Toaster />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}

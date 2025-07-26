"use client";

import { useState } from 'react';
import type { Station } from '@/lib/types';
import { availableStations, userVehicle } from '@/lib/mock-data';
import Header from '@/components/charge-one/Header';
import WalletCard from '@/components/charge-one/WalletCard';
import VehicleStatusCard from '@/components/charge-one/VehicleStatusCard';
import MapView from '@/components/charge-one/MapView';
import ChargingSession from '@/components/charge-one/ChargingSession';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import LoginPage from './login/page';
import RechargeDialog from '@/components/charge-one/RechargeDialog';

export default function Home() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const { toast } = useToast();
  const { user, loading } = useAuth();


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

  const handleRecharge = (amount: number) => {
    setWalletBalance((prev) => prev + amount);
    setIsRechargeOpen(false);
    toast({
      title: "Recharge Successful",
      description: `₹${amount.toFixed(2)} has been added to your wallet.`,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
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

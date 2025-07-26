"use client";

import { useState, useEffect } from 'react';
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
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Home() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [walletBalance, setWalletBalance] = useState(75.50);
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);


  const handleSelectStation = (station: Station) => {
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

  if (loading) {
    return <div>Loading...</div>;
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
            <WalletCard balance={walletBalance} />
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
      <Toaster />
    </div>
  );
}

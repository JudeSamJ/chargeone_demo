
"use client";

import { useState, Suspense, useEffect, useCallback } from 'react';
import type { Station, Vehicle } from '@/lib/types';
import { defaultVehicle } from '@/lib/mock-data';
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
import { Skeleton } from '@/components/ui/skeleton';
import { rechargeWallet } from '@/ai/flows/rechargeWallet';
import RoutePlanner from '@/components/charge-one/RoutePlanner';
import { planRoute } from '@/ai/flows/planRoute';

function HomePageContent() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [userVehicle, setUserVehicle] = useState<Vehicle | null>(null);
  const [route, setRoute] = useState<google.maps.DirectionsResult | null>(null);
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);

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
        const guestVehicle = { ...defaultVehicle, currentCharge: 80 };
        setUserVehicle(guestVehicle);
        localStorage.setItem('userVehicle', JSON.stringify(guestVehicle));
      }
      else if (user) {
        router.push('/vehicle-details');
      }
    }
  }, [user, loading, router, isGuest]);
  
  const handleStationSelect = (station: Station | null) => {
    setSelectedStation(station);
    setRoute(null);
  };

  const handleEndSession = (cost: number) => {
    setWalletBalance((prev) => prev - cost);
    setSelectedStation(null);
  };
  
  const handleClearSelection = () => {
    setSelectedStation(null);
    setRoute(null);
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

  const handlePlanRoute = async (origin: string, destination: string) => {
    if (!userVehicle) {
        toast({ variant: 'destructive', title: 'Please select a vehicle first.' });
        return;
    }
    setIsPlanningRoute(true);
    try {
        const result = await planRoute({
            origin,
            destination,
            vehicle: userVehicle
        });
        setRoute(result.route);
        // If the route plan returns stations, display them. Otherwise, keep the existing ones.
        if (result.chargingStations.length > 0) {
            setStations(result.chargingStations);
        }
        setSelectedStation(null);
    } catch (error) {
        console.error("Failed to plan route:", error);
        toast({ variant: 'destructive', title: 'Failed to plan route.' });
    } finally {
        setIsPlanningRoute(false);
    }
  };

  const onStationsFound = useCallback((foundStations: Station[]) => {
    setStations(foundStations);
  }, []);

  if (loading || (!user && !isGuest) || !userVehicle) {
    return (
        <div className="min-h-screen bg-background">
             <Header />
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    <div className="lg:col-span-1 flex flex-col gap-8">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="lg:col-span-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="lg:col-span-1 flex flex-col gap-8">
            <WalletCard balance={walletBalance} onRecharge={() => setIsRechargeOpen(true)} />
            <VehicleStatusCard vehicle={userVehicle} />
            {selectedStation ? (
              <ChargingSession
                station={selectedStation}
                onEndSession={handleEndSession}
                onClearSelection={handleClearSelection}
                vehicle={userVehicle}
              />
            ) : (
                <RoutePlanner onPlanRoute={handlePlanRoute} isPlanning={isPlanningRoute} />
            )}
          </div>
          <div className="lg:col-span-2">
            <MapView 
              stations={stations} 
              onStationSelect={handleStationSelect} 
              onStationsFound={onStationsFound}
              selectedStation={selectedStation}
              route={route}
            />
          </div>
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


"use client";

import { useState, Suspense, useEffect, useCallback } from 'react';
import type { Station, Vehicle } from '@/lib/types';
import { defaultVehicle } from '@/lib/mock-data';
import MapView from '@/components/charge-one/MapView';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { rechargeWallet } from '@/ai/flows/rechargeWallet';
import { planRoute } from '@/ai/flows/planRoute';
import Controls from '@/components/charge-one/Controls';

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
    // The route should only be cleared when a new one is planned.
    // Do NOT clear it here.
  };

  const handleEndSession = (cost: number) => {
    setWalletBalance((prev) => prev - cost);
    setSelectedStation(null);
  };

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
    setRoute(null);
    setStations([]);
    setSelectedStation(null);
    try {
        const result = await planRoute({
            origin,
            destination,
            vehicle: userVehicle
        });
        setRoute(result.route);
        setStations(result.chargingStations);
    } catch (error) {
        console.error("Failed to plan route:", error);
        toast({ variant: 'destructive', title: 'Failed to plan route.' });
    } finally {
        setIsPlanningRoute(false);
    }
  };

  // The `useCallback` hook is essential here to prevent the function from
  // being recreated on every render, which would cause an infinite loop in MapView's useEffect.
  const onStationsFound = useCallback((foundStations: Station[]) => {
    setStations(foundStations);
  }, []); // The dependency array is empty because setStations is a stable function.

  if (loading || (!user && !isGuest) || !userVehicle) {
    return (
        <div className="relative h-screen w-screen">
            <Skeleton className="h-full w-full" />
            <div className="absolute top-4 left-4 z-10">
                <Skeleton className="h-[600px] w-[400px]" />
            </div>
        </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-background text-foreground">
      <Controls
        userVehicle={userVehicle}
        walletBalance={walletBalance}
        setIsRechargeOpen={setIsRechargeOpen}
        selectedStation={selectedStation}
        handleEndSession={handleEndSession}
        handleStationSelect={handleStationSelect}
        handlePlanRoute={handlePlanRoute}
        isPlanningRoute={isPlanningRoute}
        isRechargeOpen={isRechargeOpen}
        handleRecharge={handleRecharge}
      />
      <MapView 
        stations={stations} 
        onStationSelect={handleStationSelect} 
        onStationsFound={onStationsFound}
        selectedStation={selectedStation}
        route={route}
      />
      <Toaster />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen w-screen bg-background"><p>Loading...</p></div>}>
      <HomePageContent />
    </Suspense>
  )
}

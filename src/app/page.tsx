
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
import { planRoute } from '@/ai/flows/planRoute';
import Controls from '@/components/charge-one/Controls';
import { SidebarProvider, Sidebar, SidebarInset, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import Header from '@/components/charge-one/Header';

function HomePageContent() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [userVehicle, setUserVehicle] = useState<Vehicle | null>(null);
  const [route, setRoute] = useState<google.maps.DirectionsResult | null>(null);
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);


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
  };

  const handleEndSession = (cost: number) => {
    setWalletBalance((prev) => prev - cost);
    setSelectedStation(null);
  };

  const handleRecharge = (amount: number) => {
    setWalletBalance((prev) => prev + amount);
    setIsRechargeOpen(false);
    toast({
        title: "Recharge Successful",
        description: `Successfully added ₹${amount.toFixed(2)} to your wallet.`,
    });
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

  const handleClearRoute = () => {
    setRoute(null);
    setStations([]);
    setSelectedStation(null);
    setIsJourneyStarted(false);
  };
  
  const handleStartJourney = () => {
    setIsJourneyStarted(true);
    toast({
        title: "Journey Started!",
        description: "Live tracking is now active. The map will follow your location.",
    });
  }

  const handleStationsFound = useCallback((foundStations: Station[]) => {
    setStations(foundStations);
  }, [setStations]);

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
      <SidebarProvider>
        <Sidebar variant="floating" side="left">
          <SidebarRail />
          <SidebarContent className="p-4">
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
                  currentLocation={currentLocation}
                  hasRoute={!!route}
                  onClearRoute={handleClearRoute}
                  isJourneyStarted={isJourneyStarted}
                  onStartJourney={handleStartJourney}
              />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <Header />
            <MapView 
                onStationsFound={handleStationsFound} 
                stations={stations}
                onStationClick={handleStationSelect}
                route={route}
                onLocationUpdate={setCurrentLocation}
                currentLocation={currentLocation}
                isJourneyStarted={isJourneyStarted}
            />
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen w-screen bg-background"><p>Loading...</p></div>}>
      <HomePageContent />
    </Suspense>
  )
}

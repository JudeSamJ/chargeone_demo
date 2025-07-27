
"use client";

import { useState, Suspense, useEffect } from 'react';
import type { Station, Vehicle } from '@/lib/types';
import { userVehicle } from '@/lib/mock-data';
import Header from '@/components/charge-one/Header';
import WalletCard from '@/components/charge-one/WalletCard';
import VehicleStatusCard from '@/components/charge-one/VehicleStatusCard';
import MapView from '@/components/charge-one/MapView';
import ChargingSession from '@/components/charge-one/ChargingSession';
import RoutePlanner from '@/components/charge-one/RoutePlanner';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import RechargeDialog from '@/components/charge-one/RechargeDialog';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { rechargeWallet } from '@/ai/flows/rechargeWallet';
import { planRoute } from '@/ai/flows/planRoute';
import type { PlanRouteOutput } from '@/ai/flows/planRoute';

function HomePageContent() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [directions, setDirections] = useState<any>(null);
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [chargingStops, setChargingStops] = useState<Station[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);


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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError(null);
      }, (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Could not get your location. Please enable location services. Using a default location.");
        setCurrentLocation({ lat: 11.1271, lng: 78.6569 }); // Fallback to Tamil Nadu
      });
    } else {
      setLocationError("Geolocation is not supported by this browser. Using a default location.");
      setCurrentLocation({ lat: 11.1271, lng: 78.6569 });
    }
  }, []);

  useEffect(() => {
    if (locationError) {
      toast({
        variant: "destructive",
        title: "Location Error",
        description: locationError,
      })
    }
  }, [locationError, toast]);


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

  const handlePlanRoute = async (origin: string, destination: string) => {
    let startPoint = origin;
    if (!startPoint) {
        if (!currentLocation) {
            toast({ 
                variant: "destructive", 
                title: "Location Unavailable", 
                description: "Your current location isn't available yet. Please enter a starting point or wait a moment." 
            });
            return;
        }
        startPoint = `${currentLocation.lat},${currentLocation.lng}`;
    }

    if (!destination) {
        toast({ variant: "destructive", title: "Destination Required", description: "Please enter a destination." });
        return;
    }
    
    setIsPlanningRoute(true);
    setDirections(null);
    setChargingStops([]);
    
    try {
        const result: PlanRouteOutput = await planRoute({
            origin: startPoint,
            destination,
            vehicle: userVehicle,
        });

        if (result.errorMessage && !result.directions) {
            toast({ variant: 'destructive', title: "Route Planning Error", description: result.errorMessage });
        } else {
            setDirections(result.directions);
            if (result.chargingStops && result.chargingStops.length > 0) {
                setChargingStops(result.chargingStops);
            }
            if (result.errorMessage) {
                toast({ 
                  variant: result.hasSufficientCharge ? 'default' : 'destructive', 
                  title: result.hasSufficientCharge ? "Route Planned" : "Charging Stop Required", 
                  description: result.errorMessage,
                  duration: 5000,
                });
            }
        }
    } catch(e: any) {
        toast({ variant: 'destructive', title: "Error", description: e.message || "Failed to plan route." });
    } finally {
        setIsPlanningRoute(false);
    }
  }
  
  if (loading || (!user && !isGuest) || !currentLocation) {
    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
             <Header />
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-[220px] w-full" />
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
            <RoutePlanner onPlanRoute={handlePlanRoute} isPlanning={isPlanningRoute} />
            {selectedStation && (
                <ChargingSession
                station={selectedStation}
                onEndSession={handleEndSession}
                onClearSelection={handleClearSelection}
                vehicle={userVehicle}
                />
            )}
          </div>
          <div className="lg:col-span-3">
            <MapView 
              stations={stations}
              onStationsLoaded={setStations}
              onSelectStation={handleSelectStation}
              selectedStationId={selectedStation?.id}
              initialCenter={currentLocation}
              directions={directions}
              chargingStops={chargingStops}
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
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}

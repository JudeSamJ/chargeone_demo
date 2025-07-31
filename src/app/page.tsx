
"use client";

import { useState, Suspense, useEffect, useCallback, useRef } from 'react';
import type { Station, Vehicle, PlanRouteOutput } from '@/lib/types';
import { defaultVehicle } from '@/lib/mock-data';
import MapView from '@/components/charge-one/MapView';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { planRoute } from '@/ai/flows/planRoute';
import { findStations } from '@/ai/flows/findStations';
import Controls from '@/components/charge-one/Controls';
import { SidebarProvider, Sidebar, SidebarInset, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import Header from '@/components/charge-one/Header';
import { formatDuration, formatDistance } from './utils';
import { add } from 'date-fns';
import { createBooking, getUserBookings } from '@/lib/firestore';

interface LiveJourneyData {
    distance: string;
    duration: string;
    endAddress: string;
    estimatedArrivalTime: string | null;
}

function HomePageContent() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookedStationIds, setBookedStationIds] = useState<string[]>([]);
  const [userVehicle, setUserVehicle] = useState<Vehicle | null>(null);
  const [route, setRoute] = useState<google.maps.DirectionsResult | null>(null);
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);
  const [liveJourneyData, setLiveJourneyData] = useState<LiveJourneyData | null>(null);
  const journeyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [initialTripData, setInitialTripData] = useState<{distance: number, duration: number} | null>(null);
  const [mapTypeId, setMapTypeId] = useState<string>('roadmap');
  const [showTraffic, setShowTraffic] = useState(false);
  const initialLocationSetRef = useRef(false);
  

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

  useEffect(() => {
    // Fetch user bookings when authenticated
    if (user) {
        getUserBookings(user.uid)
            .then(setBookedStationIds)
            .catch(error => {
                console.error("Failed to fetch bookings:", error);
                toast({ variant: 'destructive', title: 'Could not load your bookings.' });
            });
    }
  }, [user, toast]);

  useEffect(() => {
    if (isJourneyStarted && initialTripData) {
        const startTime = Date.now();
        
        const updateJourneyData = () => {
            const elapsedTimeSeconds = (Date.now() - startTime) / 1000;
            const remainingDurationSeconds = Math.max(0, initialTripData.duration - elapsedTimeSeconds);
            const arrivalTime = new Date(Date.now() + remainingDurationSeconds * 1000);
            
            setLiveJourneyData(prev => prev ? ({
                ...prev,
                duration: formatDuration(remainingDurationSeconds),
                estimatedArrivalTime: arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }) : prev);
        };
        
        updateJourneyData(); // Initial update
        journeyIntervalRef.current = setInterval(updateJourneyData, 30000); // Update every 30 seconds

    } else if (journeyIntervalRef.current) {
        clearInterval(journeyIntervalRef.current);
        journeyIntervalRef.current = null;
    }

    return () => {
        if (journeyIntervalRef.current) {
            clearInterval(journeyIntervalRef.current);
        }
    };
}, [isJourneyStarted, initialTripData]);

  
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
  
  const handleRouteUpdate = (result: PlanRouteOutput | null) => {
    if (!result) {
        setRoute(null);
        setStations([]);
        setInitialTripData(null);
        setLiveJourneyData(null);
        return;
    }

    setRoute(result.route);
    setStations(result.chargingStations);
    setInitialTripData({ distance: result.totalDistance, duration: result.totalDuration });
    
    const leg = result.route.routes[0]?.legs[0];
    if (leg) {
        const arrivalTime = add(new Date(), {seconds: result.totalDuration});
        setLiveJourneyData({
            distance: formatDistance(result.totalDistance),
            duration: formatDuration(result.totalDuration),
            endAddress: leg.end_address || 'Destination',
            estimatedArrivalTime: arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
    } else {
        setLiveJourneyData(null);
    }
  }

  const handlePlanRoute = async (origin: string, destination: string) => {
    if (!userVehicle) {
        toast({ variant: 'destructive', title: 'Please select a vehicle first.' });
        return;
    }
    setIsPlanningRoute(true);
    handleRouteUpdate(null);
    setSelectedStation(null);

    try {
        const result = await planRoute({
            origin,
            destination,
            vehicle: userVehicle
        });
        handleRouteUpdate(result);
    } catch (error) {
        console.error("Failed to plan route:", error);
        toast({ variant: 'destructive', title: 'Failed to plan route.' });
    } finally {
        setIsPlanningRoute(false);
    }
  };

  const handleClearRoute = () => {
    handleRouteUpdate(null);
    setSelectedStation(null);
    setIsJourneyStarted(false);
    setLiveJourneyData(null);

    if (currentLocation) {
        findStations({ latitude: currentLocation.lat, longitude: currentLocation.lng, radius: 10000 })
            .then(setStations)
            .catch(err => {
                console.error("Error finding stations after clearing route:", err);
                toast({ variant: 'destructive', title: 'Could not find nearby stations.'});
                setStations([]);
            });
    } else {
        setStations([]);
    }
  };
  
  const handleStartJourney = () => {
    if (route && liveJourneyData) {
        setIsJourneyStarted(true);
        toast({
            title: "Journey Started!",
            description: "Live tracking is now active. The map will follow your location.",
        });
    } else {
         toast({
            variant: 'destructive',
            title: "Could not start journey.",
            description: "Route data is missing or incomplete.",
        });
    }
  }

  const handleBookingConfirm = async (date: Date, time: string) => {
    setIsBookingOpen(false);
    if (!selectedStation) return;
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Required",
            description: "You must be signed in to book a slot.",
        });
        return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const bookingDateTime = new Date(date);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    try {
        await createBooking(user.uid, selectedStation, bookingDateTime);
        setBookedStationIds(prev => [...prev, selectedStation.id]);
        toast({
            title: "Slot Booked!",
            description: `Your slot at ${selectedStation?.name} is confirmed for ${date.toLocaleDateString()} at ${time}.`,
        });
    } catch (error) {
        console.error("Booking failed:", error);
        toast({
            variant: 'destructive',
            title: 'Booking Failed',
            description: 'Could not save your booking. Please try again.',
        });
    }
  }

  const handleStationsFound = useCallback((foundStations: Station[]) => {
    if (!route) { // Only update stations if a route is not active
        setStations(foundStations);
    }
  }, [route]);


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
                  liveJourneyData={liveJourneyData}
                  isBookingOpen={isBookingOpen}
                  setIsBookingOpen={setIsBookingOpen}
                  onBookingConfirm={handleBookingConfirm}
                  isGuest={isGuest}
              />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <Header 
            mapTypeId={mapTypeId}
            onMapTypeIdChange={setMapTypeId}
            showTraffic={showTraffic}
            onShowTrafficChange={setShowTraffic}
          />
            <MapView 
                onStationsFound={handleStationsFound} 
                stations={stations}
                onStationClick={handleStationSelect}
                route={route}
                onLocationUpdate={setCurrentLocation}
                currentLocation={currentLocation}
                isJourneyStarted={isJourneyStarted}
                onReRoute={handlePlanRoute}
                mapTypeId={mapTypeId}
                showTraffic={showTraffic}
                bookedStationIds={bookedStationIds}
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

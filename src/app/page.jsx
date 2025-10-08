
"use client";

import { useState, Suspense, useEffect, useCallback, useRef } from 'react';
import { defaultVehicle } from '@/lib/mock-data';
import MapView from '@/components/charge-one/map/MapView';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { planRoute } from '@/ai/flows/planRoute';
import Header from '@/components/charge-one/header/Header';
import { createBooking, getUserBookings, cancelBooking } from '@/lib/firestore';
import { differenceInMinutes } from 'date-fns';
import { formatDistance, formatDuration } from './utils';
import LiveNavigationCard from '@/components/charge-one/sidebar/LiveNavigationCard';
import IconSidebar from '@/components/charge-one/sidebar/IconSidebar';
import SheetSidebar from '@/components/charge-one/sidebar/SheetSidebar';
import WalletCard from '@/components/charge-one/sidebar/WalletCard';
import VehicleStatusCard from '@/components/charge-one/sidebar/VehicleStatusCard';
import RoutePlanner from '@/components/charge-one/sidebar/RoutePlanner';
import MyBookings from '@/components/charge-one/sidebar/MyBookings';
import ChargingSession from '@/components/charge-one/sidebar/ChargingSession';
import { Button } from '@/components/ui/button';
import RechargeDialog from '@/components/charge-one/dialogs/RechargeDialog';
import BookingDialog from '@/components/charge-one/dialogs/BookingDialog';
import { useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry'];

function HomePageContent() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [userVehicle, setUserVehicle] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapTypeId, setMapTypeId] = useState('roadmap');
  const [showTraffic, setShowTraffic] = useState(true);
  const [recenterMap, setRecenterMap] = useState(() => () => {});
  
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [route, setRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [sidebarContent, setSidebarContent] = useState('home'); // 'home', 'bookings', 'vehicle'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);


  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('guest') === 'true';
  
  const originRef = useRef();
  const destinationRef = useRef();
  
  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const fetchUserBookings = useCallback(async (uid) => {
    try {
        const bookings = await getUserBookings(uid);
        setUserBookings(bookings);
    } catch (err) {
        console.error("Failed to fetch user bookings:", err);
        toast({ variant: 'destructive', title: 'Could not load your bookings.' });
    }
  }, [toast]);

  useEffect(() => {
    if (!isUserLoading && !user && !isGuest) {
      router.push('/login');
    } else if (!isUserLoading && (user || isGuest)) {
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
  }, [user, isUserLoading, router, isGuest]);

  useEffect(() => {
    if (user) {
      fetchUserBookings(user.uid);
    }
  }, [user, fetchUserBookings]);

  useEffect(() => {
    if (currentLocation && originRef.current && !originRef.current.value) {
      originRef.current.value = `${currentLocation.lat}, ${currentLocation.lng}`;
    }
  }, [currentLocation]);

  
  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setSidebarContent('station');
    setIsSidebarOpen(true);
  };

  const handleClearStationSelection = () => {
    setSelectedStation(null);
    setSidebarContent('home');
  }

  const handleEndSession = (cost) => {
    setWalletBalance((prev) => prev - cost);
    setSelectedStation(null);
    setSidebarContent('home');
  };

  const handleRecharge = (amount) => {
    setWalletBalance((prev) => prev + amount);
    setIsRechargeOpen(false);
    toast({
        title: "Recharge Successful",
        description: `Successfully added ₹${amount.toFixed(2)} to your wallet.`,
    });
  }
  
  async function calculateRoute() {
    if (!originRef.current?.value || !destinationRef.current?.value || !userVehicle) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide an origin, destination, and vehicle.' });
      return;
    }
    
    setLoadingRoute(true);
    try {
      const result = await planRoute({
        origin: originRef.current.value,
        destination: destinationRef.current.value,
        vehicle: userVehicle,
      });

      setRoute(result);
      setDirectionsResponse(result.route);
      setStations(prevStations => {
        const existingStationIds = new Set(prevStations.map(s => s.id));
        const newStations = result.requiredChargingStations.filter(s => !existingStationIds.has(s.id));
        return [...prevStations, ...newStations];
      });
      
    } catch (error) {
      console.error("Error planning route:", error);
      toast({ variant: 'destructive', title: 'Route Planning Failed', description: 'Could not calculate a route. Please try again.' });
      setRoute(null);
      setDirectionsResponse(null);
    } finally {
      setLoadingRoute(false);
    }
  }

  const clearRoute = useCallback(() => {
    setRoute(null);
    setDirectionsResponse(null);
    if (destinationRef.current) destinationRef.current.value = '';
    setSidebarContent('home');
  }, []);
  
  const handleBookingConfirm = async (date, time) => {
    if (!user || !selectedStation) {
      toast({ variant: "destructive", title: "Cannot create booking", description: "You must be signed in and select a station." });
      return;
    }

    setIsBookingOpen(false);

    const [hours, minutes] = time.split(':');
    const bookingDateTime = new Date(date);
    bookingDateTime.setHours(parseInt(hours, 10));
    bookingDateTime.setMinutes(parseInt(minutes, 10));
    bookingDateTime.setSeconds(0);

    try {
      await createBooking(user.uid, selectedStation, bookingDateTime);
      await fetchUserBookings(user.uid); 
      toast({
        title: "Slot Booked!",
        description: `Your slot at ${selectedStation?.name} is confirmed for ${bookingDateTime.toLocaleDateString()} at ${time}.`,
      });
    } catch (error) {
      console.error("Booking failed:", error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "Could not book the slot. Please try again.",
      });
    }
  }

  const handleCancelBooking = async (booking) => {
    if (!user) return;
  
    const minutesToBooking = differenceInMinutes(booking.bookingTime, new Date());
  
    if (minutesToBooking < 15) {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: "Bookings can only be cancelled up to 15 minutes before the start time.",
      });
      return;
    }
  
    try {
      await cancelBooking(user.uid, booking.id);
      await fetchUserBookings(user.uid); // Refresh bookings
      toast({
        title: "Booking Cancelled",
        description: `Your booking at ${booking.stationName} has been cancelled.`,
      });
    } catch (error) {
      console.error("Cancellation failed:", error);
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: "Could not cancel the booking. Please try again.",
      });
    }
  };

  const handleStationsFound = useCallback((foundStations) => {
    setStations(foundStations);
  }, []);
  
  useEffect(() => {
    if (route) {
      setSidebarContent('navigation');
      setIsSidebarOpen(true);
    } else if (selectedStation) {
      setSidebarContent('station');
      setIsSidebarOpen(true);
    } else {
      // Don't change content if route or station is cleared, let user decide
    }
  }, [route, selectedStation]);
  
  const handleIconSidebarClick = (content) => {
    if (content === sidebarContent && isSidebarOpen) {
      setIsSidebarOpen(false);
    } else {
      setSidebarContent(content);
      setIsSidebarOpen(true);
    }
  };

  if (isUserLoading || !userVehicle || !isGoogleMapsLoaded) {
    return (
        <div className="relative h-screen w-screen flex items-center justify-center">
            <Skeleton className="h-full w-full absolute" />
            <p>Loading...</p>
        </div>
    );
  }
  
  const activeBookingForSelectedStation = selectedStation ? userBookings.find(b => b.stationId === selectedStation.id) : null;
  const bookedStationIds = userBookings.map(b => b.stationId);
  const hasActiveRoute = !!route && !!directionsResponse;
  
  const navigationData = hasActiveRoute ? {
    distance: formatDistance(route.totalDistance),
    duration: formatDuration(route.totalDuration),
    endAddress: directionsResponse.routes[0].legs[0].end_address,
  } : null;
  
  const contentTitles = {
    home: "Route Planner",
    bookings: "My Bookings",
    wallet: "My Wallet",
    vehicle: "My Vehicle",
    station: "Charging Station Details",
    navigation: "Live Navigation"
  }
  const sidebarTitle = contentTitles[sidebarContent] || "ChargeOne";


  const renderSidebarContent = () => {
    switch (sidebarContent) {
      case 'station':
        return <ChargingSession
                    station={selectedStation}
                    onEndSession={handleEndSession}
                    onClearSelection={handleClearStationSelection}
                    vehicle={userVehicle}
                    onBookSlot={() => setIsBookingOpen(true)}
                    isGuest={isGuest}
                    onCancelBooking={handleCancelBooking}
                    activeBooking={activeBookingForSelectedStation}
                    hasOtherBooking={userBookings.length > 0 && !activeBookingForSelectedStation}
                />;
      case 'navigation':
         return navigationData ? <LiveNavigationCard data={navigationData} onClearRoute={clearRoute} /> : null;
      case 'home':
        return <RoutePlanner 
                  onPlanRoute={calculateRoute} 
                  originRef={originRef}
                  destinationRef={destinationRef}
                  loading={loadingRoute}
                  onClearRoute={clearRoute}
                  hasActiveRoute={hasActiveRoute}
                  isLoaded={isGoogleMapsLoaded}
                />;
      case 'bookings':
        return <MyBookings 
                  bookings={userBookings} 
                  onCancelBooking={handleCancelBooking} 
                  onSelectStation={handleStationSelect}
                />;
      case 'wallet':
        return <WalletCard balance={walletBalance} onRecharge={() => setIsRechargeOpen(true)} />;
      case 'vehicle':
        return (
          <>
            <VehicleStatusCard vehicle={userVehicle} />
             <Button className="w-full" onClick={() => router.push('/vehicle-details')}>
                Change Vehicle
              </Button>
          </>
        );
      default:
        return null;
    }
  }


  return (
      <div className="flex h-screen w-screen bg-background">
        <IconSidebar activeContent={sidebarContent} setActiveContent={handleIconSidebarClick} isGuest={isGuest} />
        <SheetSidebar isOpen={isSidebarOpen} onOpenChange={setIsSidebarOpen} title={sidebarTitle}>
          <div className="p-4 space-y-4 h-full overflow-y-auto">
            {renderSidebarContent()}
          </div>
        </SheetSidebar>
        <main className="flex-1 relative">
          <Header 
            mapTypeId={mapTypeId}
            onMapTypeIdChange={setMapTypeId}
            showTraffic={showTraffic}
            onShowTrafficChange={setShowTraffic}
            onRecenter={recenterMap}
          />
          <MapView 
              onStationsFound={handleStationsFound} 
              stations={stations}
              onStationClick={handleStationSelect}
              directionsResponse={directionsResponse}
              route={route}
              onLocationUpdate={setCurrentLocation}
              currentLocation={currentLocation}
              mapTypeId={mapTypeId}
              showTraffic={showTraffic}
              bookedStationIds={bookedStationIds}
              setRecenterCallback={setRecenterMap}
              vehicle={userVehicle}
              isLoaded={isGoogleMapsLoaded}
          />
        </main>
        <RechargeDialog 
          isOpen={isRechargeOpen}
          onOpenChange={setIsRechargeOpen}
          onRecharge={handleRecharge}
          razorpayKeyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? ""} 
        />
        <BookingDialog
            isOpen={isBookingOpen}
            onOpenChange={setIsBookingOpen}
            station={selectedStation}
            onConfirm={handleBookingConfirm}
        />
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

    
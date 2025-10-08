"use client";

import { planRoute } from "@/ai/flows/planRoute";
import BookingDialog from "@/components/charge-one/dialogs/BookingDialog";
import FilterDialog from "@/components/charge-one/dialogs/FilterDialog";
import Header from "@/components/charge-one/header/Header";
import MapView from "@/components/charge-one/map/MapView";
import ChargingSession from "@/components/charge-one/sidebar/ChargingSession";
import LiveNavigationCard from "@/components/charge-one/sidebar/LiveNavigationCard";
import SidebarNav from "@/components/charge-one/sidebar/SideBarNav";
import SidebarPanel from "@/components/charge-one/sidebar/SidebarPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cancelBooking, createBooking, getUserBookings } from "@/lib/firestore";
import { defaultVehicle } from "@/lib/mock-data";
import { useJsApiLoader } from "@react-google-maps/api";
import { differenceInMinutes } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { decodePolyline, formatDistance, formatDuration } from "./utils";

const libraries = ["places", "geometry"];

function HomePageContent() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyBMltP754BsiINUjJ90C0HE5YE0As2cTcc",
    libraries,
  });

  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [userVehicle, setUserVehicle] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapTypeId, setMapTypeId] = useState("roadmap");
  const [showTraffic, setShowTraffic] = useState(true);
  const [recenterMap, setRecenterMap] = useState(() => () => {});
  const [routePath, setRoutePath] = useState([]); // decoded polyline

  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [route, setRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [activePanel, setActivePanel] = useState("planner");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState([
    "CCS",
    "CHAdeMO",
    "Type 2",
  ]);

  const { toast } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get("guest") === "true";

  const originRef = useRef(null);
  const destinationRef = useRef(null);
  const [originAutocomplete, setOriginAutocomplete] = useState(null);
  const [destinationAutocomplete, setDestinationAutocomplete] = useState(null);

  const fetchUserBookings = useCallback(
    async (uid) => {
      try {
        const bookings = await getUserBookings(uid);
        setUserBookings(bookings);
      } catch (err) {
        console.error("Failed to fetch user bookings:", err);
        toast({
          variant: "destructive",
          title: "Could not load your bookings.",
        });
      }
    },
    [toast]
  );
  async function calculateRoute() {
    if (
      !originRef.current?.value ||
      !destinationRef.current?.value ||
      !userVehicle
    ) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide an origin, destination, and vehicle.",
      });
      return;
    }

    setLoadingRoute(true);
    try {
      const origin = originRef.current.value;
      const destination = destinationRef.current.value;

      const result = await planRoute({
        origin,
        destination,
        vehicle: userVehicle,
      });
      setRoute(result);
      setDirectionsResponse(result.route);
      if (result.route?.routes?.[0]?.overview_polyline?.points) {
        const decoded = decodePolyline(
          result.route.routes[0].overview_polyline.points
        );
        setRoutePath(decoded);
      } else {
        setRoutePath([]);
      }

      setStations((prevStations) => {
        const existingStationIds = new Set(prevStations.map((s) => s.id));
        const newStations = result.requiredChargingStations.filter(
          (s) => !existingStationIds.has(s.id)
        );
        return [...prevStations, ...newStations];
      });
      setActivePanel(null); // Hide panel to show navigation card
    } catch (error) {
      console.error("Error planning route:", error);
      toast({
        variant: "destructive",
        title: "Route Planning Failed",
        description: "Could not calculate a route. Please try again.",
      });
      setRoute(null);
      setDirectionsResponse(null);
      setRoutePath([]);
    } finally {
      setLoadingRoute(false);
    }
  }
  useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push("/login");
    } else if (!loading && (user || isGuest)) {
      const storedVehicle = localStorage.getItem("userVehicle");
      if (storedVehicle) {
        const parsedVehicle = JSON.parse(storedVehicle);
        setUserVehicle(parsedVehicle);
        setActiveFilters([parsedVehicle.connectorType]);
      } else if (isGuest) {
        const guestVehicle = { ...defaultVehicle, currentCharge: 80 };
        setUserVehicle(guestVehicle);
        localStorage.setItem("userVehicle", JSON.stringify(guestVehicle));
        setActiveFilters([guestVehicle.connectorType]);
      } else {
        router.push("/vehicle-details");
      }
    }
  }, [user, loading, router, isGuest]);

  useEffect(() => {
    if (user) {
      fetchUserBookings(user.uid);
    }
  }, [user, fetchUserBookings]);

  const setOriginToCurrentLocation = useCallback(() => {
    if (currentLocation && originRef.current) {
      if (currentLocation.lat && currentLocation.lng) {
        originRef.current.value = `${currentLocation.lat.toFixed(
          6
        )}, ${currentLocation.lng.toFixed(6)}`;
      }
    }
  }, [currentLocation]);

  useEffect(() => {
    if (activePanel === "planner" && isLoaded) {
      setOriginToCurrentLocation();
    }
  }, [activePanel, setOriginToCurrentLocation, isLoaded]);

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    if (station) {
      setActivePanel(null); // Close panel to show charging session
    } else {
      setActivePanel("planner"); // Re-open planner when deselected
    }
  };

  const handleEndSession = (cost) => {
    setWalletBalance((prev) => prev - cost);
    setSelectedStation(null);
    setActivePanel("planner");
  };

  const handleRecharge = (amount) => {
    setWalletBalance((prev) => prev + amount);
    setIsRechargeOpen(false);
    toast({
      title: "Recharge Successful",
      description: `Successfully added ₹${amount.toFixed(2)} to your wallet.`,
    });
  };

  async function calculateRoute() {
    if (
      !originRef.current?.value ||
      !destinationRef.current?.value ||
      !userVehicle
    ) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide an origin, destination, and vehicle.",
      });
      return;
    }

    setLoadingRoute(true);
    try {
      const origin = originRef.current.value;
      const destination = destinationRef.current.value;

      const result = await planRoute({
        origin,
        destination,
        vehicle: userVehicle,
      });

      setRoute(result);
      setDirectionsResponse(result.route);
      setStations((prevStations) => {
        const existingStationIds = new Set(prevStations.map((s) => s.id));
        const newStations = result.requiredChargingStations.filter(
          (s) => !existingStationIds.has(s.id)
        );
        return [...prevStations, ...newStations];
      });
      setActivePanel(null); // Hide panel to show navigation card
    } catch (error) {
      console.error("Error planning route:", error);
      toast({
        variant: "destructive",
        title: "Route Planning Failed",
        description: "Could not calculate a route. Please try again.",
      });
      setRoute(null);
      setDirectionsResponse(null);
    } finally {
      setLoadingRoute(false);
    }
  }

  const clearRoute = useCallback(() => {
    setRoute(null);
    setDirectionsResponse(null);
    if (destinationRef.current) destinationRef.current.value = "";
    if (originRef.current) originRef.current.value = "";
    setOriginToCurrentLocation();
    setActivePanel("planner");
  }, [setOriginToCurrentLocation]);

  const handleBookingConfirm = async (date, time) => {
    if (!user || !selectedStation) {
      toast({
        variant: "destructive",
        title: "Cannot create booking",
        description: "You must be signed in and select a station.",
      });
      return;
    }

    setIsBookingOpen(false);

    const [hours, minutes] = time.split(":");
    const bookingDateTime = new Date(date);
    bookingDateTime.setHours(parseInt(hours, 10));
    bookingDateTime.setMinutes(parseInt(minutes, 10));
    bookingDateTime.setSeconds(0);

    try {
      await createBooking(user.uid, selectedStation, bookingDateTime);
      await fetchUserBookings(user.uid);
      toast({
        title: "Slot Booked!",
        description: `Your slot at ${
          selectedStation?.name
        } is confirmed for ${bookingDateTime.toLocaleDateString()} at ${time}.`,
      });
    } catch (error) {
      console.error("Booking failed:", error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "Could not book the slot. Please try again.",
      });
    }
  };

  const handleCancelBooking = async (booking) => {
    if (!user) return;

    const minutesToBooking = differenceInMinutes(
      booking.bookingTime,
      new Date()
    );

    if (minutesToBooking < 15) {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description:
          "Bookings can only be cancelled up to 15 minutes before the start time.",
      });
      return;
    }

    try {
      await cancelBooking(booking.id);
      await fetchUserBookings(user.uid);
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

  const handlePanelToggle = (panel) => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
    }
    // Clear route and selection when opening a panel
    if (route) clearRoute();
    if (selectedStation) setSelectedStation(null);
  };

  const onOriginPlaceChanged = () => {
    if (originAutocomplete !== null && originRef.current) {
      const place = originAutocomplete.getPlace();
      originRef.current.value = place.formatted_address || place.name || "";
    }
  };

  const onDestinationPlaceChanged = () => {
    if (destinationAutocomplete !== null && destinationRef.current) {
      const place = destinationAutocomplete.getPlace();
      destinationRef.current.value =
        place.formatted_address || place.name || "";
    }
  };

  if (
    loading ||
    (!user && !isGuest) ||
    !userVehicle ||
    !isLoaded ||
    loadError
  ) {
    return (
      <div className="relative h-screen w-screen">
        <Skeleton className="h-full w-full" />
        <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-2 border">
          <Skeleton className="h-16 w-[90vw] sm:w-[400px]" />
        </div>
        <div className="absolute top-24 left-4 z-10">
          <Skeleton className="h-[600px] w-[400px]" />
        </div>
      </div>
    );
  }

  const activeBookingForSelectedStation = selectedStation
    ? userBookings.find((b) => b.stationId === selectedStation.id)
    : null;
  const bookedStationIds = userBookings.map((b) => b.stationId);
  const hasActiveRoute = !!route && !!directionsResponse;

  const navigationData = hasActiveRoute
    ? {
        distance: formatDistance(route.totalDistance),
        duration: formatDuration(route.totalDuration),
        endAddress: directionsResponse.routes[0].legs[0].end_address,
      }
    : null;

  let mainContent = null;
  if (selectedStation) {
    mainContent = (
      <ChargingSession
        station={selectedStation}
        vehicle={userVehicle}
        onEndSession={handleEndSession}
        onClearSelection={() => handleStationSelect(null)}
        onBookSlot={() => setIsBookingOpen(true)}
        isGuest={isGuest}
        activeBooking={activeBookingForSelectedStation}
        hasOtherBooking={
          userBookings.length > 0 && !activeBookingForSelectedStation
        }
        onCancelBooking={handleCancelBooking}
      />
    );
  } else if (hasActiveRoute && navigationData) {
    mainContent = (
      <LiveNavigationCard data={navigationData} onClearRoute={clearRoute} />
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <SidebarNav
        activePanel={activePanel}
        onPanelToggle={handlePanelToggle}
        isGuest={isGuest}
      />

      {isLoaded && (
        <div className="absolute top-24 left-20 z-10 w-[380px]">
          {mainContent}
        </div>
      )}

      {isLoaded && (
        <SidebarPanel
          activePanel={activePanel}
          onClose={() => setActivePanel(null)}
          isGuest={isGuest}
          userVehicle={userVehicle}
          walletBalance={walletBalance}
          onRechargeClick={() => setIsRechargeOpen(true)}
          onPlanRoute={calculateRoute}
          originRef={originRef}
          destinationRef={destinationRef}
          loadingRoute={loadingRoute}
          onUseMyLocation={setOriginToCurrentLocation}
          userBookings={userBookings}
          onCancelBooking={handleCancelBooking}
          onSelectStation={handleStationSelect}
          isRechargeOpen={isRechargeOpen}
          setIsRechargeOpen={setIsRechargeOpen}
          handleRecharge={handleRecharge}
          setOriginAutocomplete={setOriginAutocomplete}
          setDestinationAutocomplete={setDestinationAutocomplete}
          onOriginPlaceChanged={onOriginPlaceChanged}
          onDestinationPlaceChanged={onDestinationPlaceChanged}
        />
      )}

      <div className="h-full w-full">
        {isLoaded && (
          <Header
            mapTypeId={mapTypeId}
            onMapTypeIdChange={setMapTypeId}
            showTraffic={showTraffic}
            onShowTrafficChange={setShowTraffic}
            onRecenter={recenterMap}
            onFilterClick={() => setIsFilterOpen(true)}
          />
        )}
        <MapView
          isLoaded={isLoaded}
          onStationsFound={handleStationsFound}
          stations={stations}
          routePath={routePath}
          onStationClick={handleStationSelect}
          directionsResponse={directionsResponse}
          onLocationUpdate={setCurrentLocation}
          currentLocation={currentLocation}
          mapTypeId={mapTypeId}
          showTraffic={showTraffic}
          bookedStationIds={bookedStationIds}
          setRecenterCallback={setRecenterMap}
          activeFilters={activeFilters}
        />
      </div>
      <Toaster />
      <BookingDialog
        isOpen={isBookingOpen}
        onOpenChange={setIsBookingOpen}
        station={selectedStation}
        onConfirm={handleBookingConfirm}
      />
      <FilterDialog
        isOpen={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        userVehicleConnector={userVehicle?.connectorType}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen w-screen bg-background">
          <p>Loading...</p>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}

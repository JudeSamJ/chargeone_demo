
"use client";

import WalletCard from "./WalletCard";
import VehicleStatusCard from "./VehicleStatusCard";
import ChargingSession from "./ChargingSession";
import RoutePlanner from "./RoutePlanner";
import RechargeDialog from "./RechargeDialog";
import LiveNavigationCard from "./LiveNavigationCard";
import BookingDialog from "./BookingDialog";
import MyBookings from "./MyBookings";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Navigation, X, Route, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


export default function Controls({
    userVehicle,
    walletBalance,
    setIsRechargeOpen,
    selectedStation,
    handleEndSession,
    handleStationSelect,
    handlePlanRoute,
    isPlanningRoute,
    isRechargeOpen,
    handleRecharge,
    currentLocation,
    hasRoute,
    onClearRoute,
    isJourneyStarted,
    onStartJourney,
    liveJourneyData,
    isBookingOpen,
    setIsBookingOpen,
    onBookingConfirm,
    isGuest,
    userBookings,
    onCancelBooking,
    activeBookingForSelectedStation
}) {

    const ActiveRouteCard = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-6 w-6 text-primary" />
                    Route Planned
                </CardTitle>
                <CardDescription>
                    Ready to start your trip. Stations are marked on the map.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={onStartJourney} className="w-full">
                    <Navigation className="mr-2" /> Start Journey
                </Button>
            </CardContent>
             <CardFooter>
                 <Button variant="outline" onClick={onClearRoute} className="w-full">
                    <X className="mr-2 h-4 w-4" /> Clear Route
                 </Button>
            </CardFooter>
        </Card>
    );
    
    const showRoutePlanner = !selectedStation && !isJourneyStarted && !hasRoute;

    return (
        <>
            <div className="space-y-4">
                <WalletCard balance={walletBalance} onRecharge={() => setIsRechargeOpen(true)} />
                <VehicleStatusCard vehicle={userVehicle} />
                {selectedStation ? (
                    <ChargingSession
                        station={selectedStation}
                        onEndSession={handleEndSession}
                        onClearSelection={() => handleStationSelect(null)}
                        vehicle={userVehicle}
                        onBookSlot={() => setIsBookingOpen(true)}
                        isGuest={isGuest}
                        onCancelBooking={onCancelBooking}
                        activeBooking={activeBookingForSelectedStation}
                        hasOtherBooking={userBookings.length > 0 && !activeBookingForSelectedStation}
                    />
                ) : isJourneyStarted && liveJourneyData ? (
                    <LiveNavigationCard 
                        data={liveJourneyData}
                        onClearRoute={onClearRoute}
                    />
                ) : hasRoute ? (
                     <ActiveRouteCard />
                ) : (
                    <Tabs defaultValue="planner" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="planner"><Route className="mr-2"/>Planner</TabsTrigger>
                            <TabsTrigger value="bookings" disabled={isGuest}><CalendarDays className="mr-2"/>Bookings</TabsTrigger>
                        </TabsList>
                        <TabsContent value="planner">
                            <RoutePlanner onPlanRoute={handlePlanRoute} isPlanning={isPlanningRoute} currentLocation={currentLocation}/>
                        </TabsContent>
                        <TabsContent value="bookings">
                            <MyBookings 
                                bookings={userBookings} 
                                onCancelBooking={onCancelBooking} 
                                onSelectStation={handleStationSelect}
                            />
                        </TabsContent>
                    </Tabs>
                )}
            </div>
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
                onConfirm={onBookingConfirm}
            />
        </>
    );
}

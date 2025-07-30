
"use client";

import { Station, Vehicle } from "@/lib/types";
import WalletCard from "./WalletCard";
import VehicleStatusCard from "./VehicleStatusCard";
import ChargingSession from "./ChargingSession";
import RoutePlanner from "./RoutePlanner";
import RechargeDialog from "./RechargeDialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { X, Navigation, CheckCircle } from 'lucide-react';

interface ControlsProps {
    userVehicle: Vehicle;
    walletBalance: number;
    setIsRechargeOpen: (isOpen: boolean) => void;
    selectedStation: Station | null;
    handleEndSession: (cost: number) => void;
    handleStationSelect: (station: Station | null) => void;
    handlePlanRoute: (origin: string, destination: string) => void;
    isPlanningRoute: boolean;
    isRechargeOpen: boolean;
    handleRecharge: (amount: number) => void;
    currentLocation: google.maps.LatLngLiteral | null;
    hasRoute: boolean;
    onClearRoute: () => void;
    isJourneyStarted: boolean;
    onStartJourney: () => void;
}

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
}: ControlsProps) {

    const ActiveRouteCard = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-6 w-6 text-primary" />
                    Route Active
                </CardTitle>
                <CardDescription>
                    Charging stations along your path are shown on the map.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isJourneyStarted ? (
                    <div className="p-3 rounded-md bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>Live navigation is active.</span>
                    </div>
                ) : (
                    <Button onClick={onStartJourney} className="w-full">
                        <Navigation className="mr-2" /> Start Journey
                    </Button>
                )}
            </CardContent>
            <CardFooter>
                 <Button variant="outline" onClick={onClearRoute} className="w-full">
                    <X className="mr-2 h-4 w-4" /> Clear Route
                 </Button>
            </CardFooter>
        </Card>
    );

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
                    />
                ) : hasRoute ? (
                     <ActiveRouteCard />
                ) : (
                    <RoutePlanner onPlanRoute={handlePlanRoute} isPlanning={isPlanningRoute} currentLocation={currentLocation}/>
                )}
            </div>
             <RechargeDialog 
                isOpen={isRechargeOpen}
                onOpenChange={setIsRechargeOpen}
                onRecharge={handleRecharge}
                razorpayKeyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}
            />
        </>
    );
}

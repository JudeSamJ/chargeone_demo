
"use client";

import { Station, Vehicle } from "@/lib/types";
import WalletCard from "./WalletCard";
import VehicleStatusCard from "./VehicleStatusCard";
import ChargingSession from "./ChargingSession";
import RoutePlanner from "./RoutePlanner";
import RechargeDialog from "./RechargeDialog";
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

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
}: ControlsProps) {

    return (
        <>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <WalletCard balance={walletBalance} onRecharge={() => setIsRechargeOpen(true)} />
                    <VehicleStatusCard vehicle={userVehicle} />
                </div>
                {selectedStation ? (
                    <ChargingSession
                        station={selectedStation}
                        onEndSession={handleEndSession}
                        onClearSelection={() => handleStationSelect(null)}
                        vehicle={userVehicle}
                    />
                ) : hasRoute ? (
                     <Card className="p-4 text-center">
                        <p className="font-medium">A route is active.</p>
                        <p className="text-sm text-muted-foreground mb-4">Charging stations along your path are shown on the map.</p>
                        <Button variant="outline" onClick={onClearRoute} className="w-full">
                           <X className="mr-2 h-4 w-4" /> Clear Route
                        </Button>
                    </Card>
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

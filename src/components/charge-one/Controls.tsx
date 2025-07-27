
"use client";

import { Station, Vehicle } from "@/lib/types";
import WalletCard from "./WalletCard";
import VehicleStatusCard from "./VehicleStatusCard";
import ChargingSession from "./ChargingSession";
import RoutePlanner from "./RoutePlanner";
import RechargeDialog from "./RechargeDialog";
import Header from "./Header";
import { Button } from "../ui/button";
import { X } from "lucide-react";

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
        <div className="absolute top-0 left-0 z-10 h-screen w-full max-w-md flex flex-col">
            <Header />
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 bg-background/80 backdrop-blur-sm">
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
                     <div className="p-4 rounded-lg bg-card text-card-foreground shadow-sm text-center">
                        <p className="font-medium">A route is active.</p>
                        <p className="text-sm text-muted-foreground mb-4">Charging stations along your path are shown on the map.</p>
                        <Button variant="outline" onClick={onClearRoute} className="w-full">
                           <X className="mr-2 h-4 w-4" /> Clear Route
                        </Button>
                    </div>
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
        </div>
    );
}

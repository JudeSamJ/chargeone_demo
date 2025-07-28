"use client";

import { useState } from 'react';
import { Station, Vehicle } from "@/lib/types";
import WalletCard from "./WalletCard";
import VehicleStatusCard from "./VehicleStatusCard";
import ChargingSession from "./ChargingSession";
import RoutePlanner from "./RoutePlanner";
import RechargeDialog from "./RechargeDialog";
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { X, Bolt, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOutWithGoogle } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from './ThemeToggle';


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
    const { user, loading } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
        await signOutWithGoogle();
        // Clear user-specific data
        localStorage.removeItem('userVehicle');
        router.push('/login');
        } catch (error) {
        console.error("Sign out failed", error);
        }
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'G';
        const names = name.split(' ');
        const initials = names.map(n => n[0]).join('');
        return initials.toUpperCase() || 'G';
    }

    return (
        <>
            <div className="absolute top-4 left-4 z-10 w-full max-w-sm space-y-4">
                 <header className="bg-background/80 backdrop-blur-sm rounded-lg p-2 border">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Bolt className="h-7 w-7 text-primary" />
                            <h1 className="text-2xl font-bold text-primary font-headline">ChargeOne</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            {!loading && (
                            user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                        <Avatar>
                                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user.email}
                                        </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleSignOut}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                ) : (
                                <Button variant="outline" onClick={() => router.push('/login')}>
                                    Sign In
                                </Button>
                                )
                            )}
                        </div>
                        </div>
                    </div>
                </header>
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
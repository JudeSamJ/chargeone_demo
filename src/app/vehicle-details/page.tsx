"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { Vehicle } from "@/lib/types";
import { vehicles } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Car, BatteryFull, Save } from "lucide-react";

export default function VehicleDetailsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(vehicles[0]);
    const [charge, setCharge] = useState(80);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    const handleVehicleChange = (value: string) => {
        const [make, model] = value.split('|');
        const vehicle = vehicles.find(v => v.make === make && v.model === model);
        setSelectedVehicle(vehicle || null);
    }
    
    const handleSave = () => {
        if (selectedVehicle) {
            const vehicleToSave = { ...selectedVehicle, currentCharge: charge };
            localStorage.setItem('userVehicle', JSON.stringify(vehicleToSave));
            router.push('/');
        }
    }

    if (loading || !user) {
        return <div className="flex items-center justify-center min-h-screen bg-background"><p>Loading...</p></div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Car className="h-6 w-6" />
                        Your Vehicle
                    </CardTitle>
                    <CardDescription>
                        Select your vehicle and set its current charge to get started.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-2">
                        <Label htmlFor="vehicle-select">Vehicle Model</Label>
                         <Select onValueChange={handleVehicleChange} defaultValue={`${vehicles[0].make}|${vehicles[0].model}`}>
                            <SelectTrigger id="vehicle-select">
                                <SelectValue placeholder="Select your vehicle" />
                            </SelectTrigger>
                            <SelectContent>
                                {vehicles.map(v => (
                                    <SelectItem key={`${v.make}-${v.model}`} value={`${v.make}|${v.model}`}>
                                        {v.make} {v.model}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                           <Label htmlFor="charge-slider">Current Charge</Label>
                           <span className="text-2xl font-bold text-primary">{charge}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <BatteryFull className="h-8 w-8 text-muted-foreground" />
                            <Slider
                                id="charge-slider"
                                value={[charge]}
                                onValueChange={(value) => setCharge(value[0])}
                                max={100}
                                step={1}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSave} disabled={!selectedVehicle}>
                        <Save className="mr-2" />
                        Save and Continue
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

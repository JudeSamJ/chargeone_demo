
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Bolt, Timer, BatteryCharging, Power, CheckCircle, Zap, X, Undo2, CalendarClock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ChargingSession({ station, vehicle, onEndSession, onClearSelection, onBookSlot, isGuest, hasActiveBooking }) {
  const [isCharging, setIsCharging] = useState(false);
  const [sessionFinished, setSessionFinished]_useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [energyAdded, setEnergyAdded] = useState(0);
  const [finalCost, setFinalCost] = useState(0);
  const { toast } = useToast();

  const cost = station ? energyAdded * station.pricePerKwh : 0;
  const chargePercentage = vehicle.currentCharge + (energyAdded / vehicle.batteryCapacity) * 100;
  
  useEffect(() => {
    // Reset state when station changes
    setIsCharging(false);
    setSessionFinished(false);
    setElapsedTime(0);
    setEnergyAdded(0);
    setFinalCost(0);
  }, [station]);

  useEffect(() => {
    let interval;
    if (isCharging && station) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        setEnergyAdded((prev) => prev + (station.power / 3600)); // kW to kWh per second
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCharging, station]);
  
  const handleStart = () => {
    setIsCharging(true);
    setSessionFinished(false);
  };
  
  const handleStop = () => {
    setIsCharging(false);
    setSessionFinished(true);
    const finalCostValue = cost;
    setFinalCost(finalCostValue);
    toast({
        title: "Charging Stopped",
        description: `Your wallet has been charged ₹${finalCostValue.toFixed(2)}.`,
    });
  };

  const handleRequestRefund = () => {
    toast({
        title: "Refund Requested",
        description: `Your request for a refund of ₹${finalCost.toFixed(2)} has been submitted for review.`,
    });
  };
  
  const handleClose = () => {
    onEndSession(finalCost);
  };
  
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleBookSlotClick = () => {
    if (isGuest) {
      toast({
        variant: "destructive",
        title: "Sign In Required",
        description: "Please sign in to book a charging slot.",
      });
      return;
    }
    onBookSlot();
  }

  if (!station) {
    // This component now returns null if no station is selected,
    // as the main page will conditionally render it.
    return null;
  }

  if (sessionFinished) {
    return (
        <Card className="h-full flex flex-col justify-between">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Session Summary</CardTitle>
                    <CheckCircle className="h-8 w-8 text-chart-2" />
                </div>
                <CardDescription>Your vehicle charging is complete.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Total Cost</span>
                    <span className="text-xl font-bold text-primary">₹{finalCost.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="space-y-1"><p className="text-muted-foreground">Station</p><p className="font-medium truncate">{station.name}</p></div>
                    <div className="space-y-1"><p className="text-muted-foreground">Time Charged</p><p className="font-medium">{formatTime(elapsedTime)}</p></div>
                    <div className="space-y-1"><p className="text-muted-foreground">Energy Added</p><p className="font-medium">{energyAdded.toFixed(2)} kWh</p></div>
                    <div className="space-y-1"><p className="text-muted-foreground">Final Charge</p><p className="font-medium">{Math.min(100, chargePercentage).toFixed(0)}%</p></div>
                </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2">
                <Button onClick={handleClose} className="w-full">Close</Button>
                <Button onClick={handleRequestRefund} className="w-full" variant="outline">
                    <Undo2 className="mr-2 h-4 w-4" />
                    Request Refund
                </Button>
            </CardFooter>
        </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="truncate">{station.name}</CardTitle>
                <CardDescription className="truncate">{station.location}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onClearSelection}>
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center flex-grow py-0">
        <Bolt className={`h-10 w-10 text-primary ${isCharging ? 'animate-pulse' : ''}`} />
        <p className="text-2xl font-bold mt-1 font-headline">{Math.min(100, chargePercentage).toFixed(0)}%</p>
        <Progress value={Math.min(100, chargePercentage)} className="w-full max-w-xs mt-2" />
        <div className="grid grid-cols-3 gap-1 mt-3 w-full max-w-md text-center">
            <div>
                <Timer className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="mt-1 font-bold text-sm">{formatTime(elapsedTime)}</p>
                <p className="text-xs text-muted-foreground">Time</p>
            </div>
            <div>
                <BatteryCharging className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="mt-1 font-bold text-sm">{energyAdded.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">kWh</p>
            </div>
            <div>
                <Power className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="mt-1 font-bold text-sm">₹{cost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Est. Cost</p>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-4">
        {isCharging ? (
          <Button onClick={handleStop} variant="destructive" className="w-full">
            <Power className="mr-2 h-4 w-4" /> Stop Charging
          </Button>
        ) : (
          <div className="w-full flex flex-col sm:flex-row gap-2">
            <Button onClick={handleStart} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <BatteryCharging className="mr-2 h-4 w-4" /> Start Charging
            </Button>
            {station.hasSlotBooking && (
                <Button 
                    onClick={handleBookSlotClick} 
                    className="w-full" 
                    variant="outline" 
                    disabled={isGuest}
                >
                    <CalendarClock className="mr-2 h-4 w-4" /> Book Slot
                </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

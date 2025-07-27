
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Map, Route, LocateFixed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoutePlannerProps {
  onPlanRoute: (origin: string, destination: string) => void;
}

export default function RoutePlanner({ onPlanRoute }: RoutePlannerProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  const handlePlanRoute = () => {
    if (origin && destination) {
      onPlanRoute(origin, destination);
    }
  };

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const latLngString = `${latitude},${longitude}`;
                setOrigin(latLngString);
                setIsLocating(false);
                toast({
                    title: "Location Found",
                    description: "Your current location has been set as the origin.",
                });
            },
            (error) => {
                console.error("Geolocation error:", error);
                setIsLocating(false);
                toast({
                    variant: "destructive",
                    title: "Location Error",
                    description: "Could not get your location. Please enable location services or enter it manually.",
                });
            }
        );
    } else {
        setIsLocating(false);
        toast({
            variant: "destructive",
            title: "Location Not Supported",
            description: "Geolocation is not supported by your browser.",
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-6 w-6" />
          Route Planner
        </CardTitle>
        <CardDescription>
          Plan a trip and find charging stations along the way.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="origin">Origin</Label>
          <div className="flex gap-2">
             <Input 
                id="origin" 
                placeholder="e.g., Delhi or lat,lng" 
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                disabled={isLocating}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                aria-label="Use Current Location"
              >
                <LocateFixed className={`h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`} />
              </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="destination">Destination</Label>
          <Input 
            id="destination" 
            placeholder="e.g., Agra" 
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handlePlanRoute} disabled={!origin || !destination || isLocating}>
          <Map className="mr-2" />
          {isLocating ? 'Getting location...' : 'Plan My Route'}
        </Button>
      </CardFooter>
    </Card>
  );
}

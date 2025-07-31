
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Map, Route, LocateFixed, Loader } from 'lucide-react';

interface RoutePlannerProps {
  onPlanRoute: (origin: string, destination: string) => void;
  isPlanning: boolean;
  currentLocation: google.maps.LatLngLiteral | null;
}

export default function RoutePlanner({ onPlanRoute, isPlanning, currentLocation }: RoutePlannerProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  useEffect(() => {
    // Automatically set origin when current location is first determined,
    // but only if the user hasn't already typed something in.
    if (currentLocation && origin === '') {
      setOrigin(`${currentLocation.lat}, ${currentLocation.lng}`);
    }
    // We only want this to run when the location is first found, or if origin is cleared.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation]);


  const handlePlanRoute = () => {
    if (origin && destination) {
      onPlanRoute(origin, destination);
    }
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
        setOrigin(`${currentLocation.lat}, ${currentLocation.lng}`);
    } else {
        alert("Could not retrieve your location. Please wait a moment or enter it manually.");
    }
  }

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
          <div className="flex items-center gap-2">
            <Input 
                id="origin" 
                placeholder="e.g., Delhi or lat,lng" 
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
            />
            <Button variant="outline" size="icon" onClick={handleUseCurrentLocation} aria-label="Use current location" disabled={!currentLocation}>
                <LocateFixed className="h-4 w-4" />
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
        <Button className="w-full" onClick={handlePlanRoute} disabled={!origin || !destination || isPlanning}>
          {isPlanning ? <Loader className="mr-2 animate-spin" /> : <Map className="mr-2" />}
          {isPlanning ? 'Planning...' : 'Plan My Route'}
        </Button>
      </CardFooter>
    </Card>
  );
}

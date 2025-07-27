
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Map, Route } from 'lucide-react';

interface RoutePlannerProps {
  onPlanRoute: (origin: string, destination: string) => void;
}

export default function RoutePlanner({ onPlanRoute }: RoutePlannerProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const handlePlanRoute = () => {
    if (origin && destination) {
      onPlanRoute(origin, destination);
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
          <Input 
            id="origin" 
            placeholder="e.g., Delhi" 
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
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
        <Button className="w-full" onClick={handlePlanRoute} disabled={!origin || !destination}>
          <Map className="mr-2" />
          Plan My Route
        </Button>
      </CardFooter>
    </Card>
  );
}

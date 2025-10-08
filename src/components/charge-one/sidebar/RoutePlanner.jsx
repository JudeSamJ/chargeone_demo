
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Map, Loader, Route, X } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';

export default function RoutePlanner({ onPlanRoute, originRef, destinationRef, loading, onClearRoute, hasActiveRoute, isLoaded }) {
  
  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Route Planner...</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader className="animate-spin" />
        </CardContent>
      </Card>
    )
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
          <Autocomplete>
            <Input 
                id="origin" 
                placeholder="e.g., Delhi" 
                ref={originRef}
                disabled={loading || hasActiveRoute}
                className="bg-background"
            />
          </Autocomplete>
        </div>
        <div className="space-y-2">
          <Label htmlFor="destination">Destination</Label>
          <Autocomplete>
            <Input 
              id="destination" 
              placeholder="e.g., Agra" 
              ref={destinationRef}
              disabled={loading || hasActiveRoute}
              className="bg-background"
            />
          </Autocomplete>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button className="w-full" onClick={onPlanRoute} disabled={loading || hasActiveRoute}>
            {loading ? <Loader className="mr-2 animate-spin" /> : <Map className="mr-2" />}
            {loading ? 'Calculating...' : 'Calculate Route'}
        </Button>
        {hasActiveRoute && (
          <Button variant="destructive" className="w-full" onClick={onClearRoute}>
            <X className="mr-2" />
            Clear Route
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

    
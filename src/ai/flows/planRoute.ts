
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Station, Vehicle } from '@/lib/types';
import { getDirections } from '@/lib/google-maps';
import { findStations } from './findStations';

const PlanRouteInputSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  vehicle: z.custom<Vehicle>(),
});

// The output from google.maps.DirectionsResult is complex, so we use z.any()
// and cast it in the component.
const PlanRouteOutputSchema = z.object({
  route: z.any(),
  chargingStations: z.array(z.custom<Station>()),
});

export type PlanRouteInput = z.infer<typeof PlanRouteInputSchema>;
export type PlanRouteOutput = z.infer<typeof PlanRouteOutputSchema>;

export async function planRoute(input: PlanRouteInput): Promise<PlanRouteOutput> {
  return planRouteFlow(input);
}

const planRouteFlow = ai.defineFlow(
  {
    name: 'planRouteFlow',
    inputSchema: PlanRouteInputSchema,
    outputSchema: PlanRouteOutputSchema,
  },
  async ({ origin, destination, vehicle }) => {
    // 1. Get the route from Google Maps
    const directionsResult = await getDirections(origin, destination);

    if (!directionsResult || directionsResult.routes.length === 0) {
      throw new Error('Could not find a route.');
    }

    // For simplicity, we only consider the first route
    const route = directionsResult.routes[0];
    const leg = route.legs[0];
    const distanceMeters = leg.distance?.value || 0;
    const distanceKm = distanceMeters / 1000;

    // 2. Determine if charging is needed
    // Simplified range: uses 1kWh for 5km as a rough estimate
    const vehicleRangeKm = vehicle.batteryCapacity * 5 * (vehicle.currentCharge / 100); 

    if (distanceKm <= vehicleRangeKm) {
      // No charging needed for this trip
      return {
        route: directionsResult,
        chargingStations: [],
      };
    }
    
    // 3. Find charging stations along the route (simplified)
    // In a real app, you'd find stations at intervals along the polyline.
    // Here, we just find stations near the midpoint for demonstration.
    const midPointIndex = Math.floor((leg.steps?.length || 0) / 2);
    if(!leg.steps || !leg.steps[midPointIndex]){
      // Not enough steps in route to find a midpoint, return route without stations
       return {
        route: directionsResult,
        chargingStations: [],
      };
    }
    const midPoint = leg.steps[midPointIndex].end_location;
    
    const chargingStations = await findStations({
        latitude: midPoint.lat(), // .lat() is a function
        longitude: midPoint.lng(), // .lng() is a function
        radius: 20000 // 20km search radius from midpoint
    });

    return {
      route: directionsResult,
      chargingStations: chargingStations,
    };
  }
);

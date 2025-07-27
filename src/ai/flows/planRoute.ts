
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

    const route = directionsResult.routes[0];
    const leg = route.legs[0];
    const distanceMeters = leg.distance?.value || 0;
    const distanceKm = distanceMeters / 1000;

    // 2. Determine if charging is needed
    // Simplified range: uses 1kWh for 5km as a rough estimate
    const vehicleRangeKm = vehicle.batteryCapacity * 5 * (vehicle.currentCharge / 100);

    if (distanceKm <= vehicleRangeKm) {
      // No charging needed for this trip, but still return the route
      return {
        route: directionsResult,
        chargingStations: [],
      };
    }
    
    // 3. Find charging stations along the route if charging is needed
    const allStations: Station[] = [];
    const stationIds = new Set<string>();

    if (leg.steps && leg.steps.length > 0) {
        // Iterate through the steps of the route to find stations along the way.
        // We'll check every 5th step to avoid excessive API calls.
        for (let i = 0; i < leg.steps.length; i += 5) {
            const step = leg.steps[i];
            const searchPoint = step.end_location; // This is a LatLngLiteral {lat, lng}
            
            if (searchPoint) {
              const foundStations = await findStations({
                  latitude: searchPoint.lat,
                  longitude: searchPoint.lng,
                  radius: 20000 // 20km search radius from this point on the route
              });

              foundStations.forEach(station => {
                  // Avoid adding duplicate stations
                  if (!stationIds.has(station.id)) {
                      allStations.push(station);
                      stationIds.add(station.id);
                  }
              });
            }
        }
    }

    return {
      route: directionsResult,
      chargingStations: allStations,
    };
  }
);

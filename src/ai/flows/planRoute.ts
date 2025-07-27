'use server';
/**
 * @fileOverview A flow to plan a route with necessary charging stops.
 *
 * - planRoute - A function that handles the route planning process.
 * - PlanRouteInput - The input type for the planRoute function.
 * - PlanRouteOutput - The return type for the planRoute function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { findStationsTool } from './findStations';
import type { Vehicle } from '@/lib/types';

// The API key is required for the Directions API call
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const PlanRouteInputSchema = z.object({
    origin: z.object({
        lat: z.number(),
        lng: z.number(),
    }),
    destination: z.string().describe("The user's desired destination address or place."),
    vehicle: z.object({
        make: z.string(),
        model: z.string(),
        batteryCapacity: z.number().describe("Total battery capacity in kWh."),
        currentCharge: z.number().describe("Current battery charge percentage (0-100)."),
    })
});
export type PlanRouteInput = z.infer<typeof PlanRouteInputSchema>;

const PlanRouteOutputSchema = z.object({
    hasSufficientCharge: z.boolean().describe("Whether the vehicle has enough charge to reach the destination without stopping."),
    directions: z.any().optional().describe("The Google Maps DirectionsResult object if a route is found."),
    errorMessage: z.string().optional().describe("An error message if a route cannot be planned."),
});
export type PlanRouteOutput = z.infer<typeof PlanRouteOutputSchema>;

const planRouteFlow = ai.defineFlow(
  {
    name: 'planRouteFlow',
    inputSchema: PlanRouteInputSchema,
    outputSchema: PlanRouteOutputSchema,
  },
  async (input) => {
    if (!GOOGLE_MAPS_API_KEY) {
        return {
            hasSufficientCharge: false,
            errorMessage: 'Google Maps API key not configured on the server.',
        };
    }
    
    const directionsUrl = new URL('https://maps.googleapis.com/maps/api/directions/json');
    directionsUrl.searchParams.append('origin', `${input.origin.lat},${input.origin.lng}`);
    directionsUrl.searchParams.append('destination', input.destination);
    directionsUrl.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    try {
        const directionsResponse = await fetch(directionsUrl.toString());
        if (!directionsResponse.ok) {
            throw new Error(`Directions API request failed: ${directionsResponse.statusText}`);
        }
        const directionsResult = await directionsResponse.json();

        if (directionsResult.status !== 'OK') {
            return {
                hasSufficientCharge: false,
                errorMessage: `Could not find a route. Directions API status: ${directionsResult.status}`,
            };
        }

        const leg = directionsResult.routes[0].legs[0];
        const distanceMeters = leg.distance.value;
        const distanceKm = distanceMeters / 1000;
        
        // Assuming an average efficiency of 5 km/kWh
        const totalRangeKm = (input.vehicle.batteryCapacity * (input.vehicle.currentCharge / 100)) * 5; 
        // Applying a 20% safety buffer
        const usableRangeKm = totalRangeKm * 0.8; 

        if (usableRangeKm > distanceKm) {
             return {
                hasSufficientCharge: true,
                directions: directionsResult,
            };
        }
        
        // If charge is not sufficient, for now we will return the direct route 
        // and a message indicating a stop is needed. A full implementation would
        // use the findStationsTool to find a charger along the route.
        return {
            hasSufficientCharge: false,
            directions: directionsResult,
            errorMessage: "Your vehicle doesn't have enough charge for this trip. A charging stop will be required."
        }

    } catch(e: any) {
        console.error("Error in planRouteFlow", e);
        return {
            hasSufficientCharge: false,
            errorMessage: e.message || "An unexpected error occurred while planning the route."
        }
    }
  }
);


export async function planRoute(input: PlanRouteInput): Promise<PlanRouteOutput> {
    return planRouteFlow(input);
}
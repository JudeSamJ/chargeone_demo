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


const planRoutePrompt = ai.definePrompt({
  name: 'planRoutePrompt',
  input: { schema: PlanRouteInputSchema },
  output: { schema: PlanRouteOutputSchema },
  tools: [findStationsTool],
  system: `You are a smart EV route planner. Your goal is to create a route from an origin to a destination, considering the vehicle's battery level and range.
  
  1.  **Calculate Vehicle Range**: The vehicle's range in kilometers is ((currentCharge / 100) * batteryCapacity) * 5. (Assuming an average efficiency of 5 km/kWh). Include a 20% safety buffer, so the usable range is 80% of the calculated range.
  2.  **Get Directions**: Use the Google Maps Directions API to find a route from origin to destination. The origin is provided as lat/lng, and the destination is a string.
  3.  **Check Range**: Compare the total distance of the primary route from the Directions API with the vehicle's usable range.
  4.  **Sufficient Charge**: If the usable range is greater than the total distance, respond that the charge is sufficient and provide the directions object.
  5.  **Insufficient Charge**: If the usable range is less than the total distance, you must find a charging station along the route.
      - Identify a point roughly 70% along the vehicle's usable range on the route.
      - Use the findStationsTool to find charging stations near that point.
      - Recalculate the route with the first available charging station from the tool as a waypoint.
      - In your response, include the updated directions object that includes the charging stop.
  6.  **Error Handling**: If no route can be found, or if no charging stations are found when needed, return an appropriate error message.
  `,
});

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
    
    // As Genkit tools cannot directly call the Google Maps Directions API,
    // we will perform the fetch call here and pass the data to the prompt.
    // In a real-world scenario, this would be a more robust tool.
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
        
        const totalRangeKm = (input.vehicle.batteryCapacity * (input.vehicle.currentCharge / 100)) * 5; // 5 km/kWh efficiency
        const usableRangeKm = totalRangeKm * 0.8; // 20% safety buffer

        if (usableRangeKm > distanceKm) {
             return {
                hasSufficientCharge: true,
                directions: directionsResult,
            };
        }
        
        // If charge is not sufficient, we need to find a charging station.
        // For this prototype, we will return a message and the original route.
        // A full implementation would involve calling the findStations tool.
        return {
            hasSufficientCharge: false,
            directions: directionsResult,
            errorMessage: "Charge is insufficient. A charging stop is required." // Placeholder message
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

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
import type { Vehicle, Station } from '@/lib/types';

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
    chargingStop: z.custom<Station>().optional().describe("The suggested charging station if a stop is needed."),
    errorMessage: z.string().optional().describe("An error message if a route cannot be planned."),
});
export type PlanRouteOutput = z.infer<typeof PlanRouteOutputSchema>;

const routingPrompt = ai.definePrompt(
    {
      name: 'routingPrompt',
      tools: [findStationsTool],
      input: { schema: z.object({
        distanceKm: z.number(),
        usableRangeKm: z.number(),
        midpoint: z.object({ lat: z.number(), lng: z.number() }),
      })},
      output: { schema: z.custom<Station>() },
      prompt: `
        You are a route planning assistant for an EV charging app.
        The user needs to travel {{distanceKm}} km, but their vehicle's usable range is only {{usableRangeKm}} km.
        Find a suitable EV charging station near the midpoint of their route, which is at latitude {{midpoint.lat}} and longitude {{midpoint.lng}}.
        Prioritize stations that are operational.
        Return the details of the best station you find.
        `,
    }
);


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
    
    const getDirections = async (origin: string, destination: string, waypoints?: string) => {
        const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
        url.searchParams.append('origin', origin);
        url.searchParams.append('destination', destination);
        if (waypoints) {
            url.searchParams.append('waypoints', waypoints);
        }
        url.searchParams.append('key', GOOGLE_MAPS_API_KEY);
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Directions API request failed: ${response.statusText}`);
        }
        return response.json();
    }

    try {
        const originStr = `${input.origin.lat},${input.origin.lng}`;
        const initialDirections = await getDirections(originStr, input.destination);

        if (initialDirections.status !== 'OK') {
            return {
                hasSufficientCharge: false,
                errorMessage: `Could not find a route. Directions API status: ${initialDirections.status}`,
            };
        }

        const leg = initialDirections.routes[0].legs[0];
        const distanceMeters = leg.distance.value;
        const distanceKm = distanceMeters / 1000;
        
        // Average efficiency of 5 km/kWh
        const totalRangeKm = (input.vehicle.batteryCapacity * (input.vehicle.currentCharge / 100)) * 5; 
        const usableRangeKm = totalRangeKm * 0.8; // 20% safety buffer

        if (usableRangeKm > distanceKm) {
             return {
                hasSufficientCharge: true,
                directions: initialDirections,
            };
        }
        
        // Charge is not sufficient, find a charging station.
        const overview_path = initialDirections.routes[0].overview_path;
        const midPointIndex = Math.floor(overview_path.length / 2);
        const midPoint = overview_path[midPointIndex];
        
        const llmResponse = await routingPrompt({
            distanceKm,
            usableRangeKm,
            midpoint: { lat: midPoint.lat, lng: midPoint.lng },
        });

        const chargingStop = llmResponse.output;
        
        if (!chargingStop || !chargingStop.lat || !chargingStop.lng) {
             return {
                hasSufficientCharge: false,
                directions: initialDirections,
                errorMessage: "Your vehicle doesn't have enough charge, and we couldn't find a suitable charging station on the route."
            }
        }
        
        const finalDirections = await getDirections(originStr, input.destination, `via:${chargingStop.lat},${chargingStop.lng}`);

        return {
            hasSufficientCharge: false,
            directions: finalDirections,
            chargingStop: chargingStop,
            errorMessage: `A stop at ${chargingStop.name} is required to complete this trip.`
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

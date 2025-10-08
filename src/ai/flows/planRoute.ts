
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Station, Vehicle, PlanRouteOutputSchema, PlanRouteInputSchema, PlanRouteInput, PlanRouteOutput } from '@/lib/types';
import { getDirections } from '@/lib/google-maps';
import { findStations } from './findStations';

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
    
    // Simple range calculation: 1 kWh gives ~5 km range.
    const vehicleMaxRangeKm = vehicle.batteryCapacity * 5; 
    const safetyBufferKm = 50; // Leave a 50km buffer
    let currentChargeKm = vehicleMaxRangeKm * (vehicle.currentCharge / 100);
    
    const stationsOnRoute: Station[] = [];
    let totalChargingTimeSeconds = 0;

    if (!leg.steps || leg.steps.length === 0) {
        return {
            route: directionsResult,
            requiredChargingStations: [],
            totalDistance: leg.distance?.value || 0,
            totalDuration: leg.duration?.value || 0,
        };
    }

    for (const step of leg.steps) {
        const stepDistanceKm = (step.distance?.value || 0) / 1000;
        
        // Check if we can complete the next step with our buffer
        if (currentChargeKm < stepDistanceKm + safetyBufferKm) {
            // Can't make it to the end of this step with a safe buffer, need to charge.
            const searchPoint = step.start_location;
            
            const nearbyStations = await findStations({
                latitude: searchPoint.lat,
                longitude: searchPoint.lng,
                radius: 50000, // 50km search radius
            });

            // Find the best available station nearby
            const bestStation = nearbyStations.find(s => s.status === 'available');

            if (bestStation) {
                // Add this station to our list of required stops if it's not already there
                if (!stationsOnRoute.some(s => s.id === bestStation.id)) {
                    stationsOnRoute.push(bestStation);
                }

                // Estimate charging time.
                // Assuming we charge from ~10% to 80% (a 70% charge)
                const chargeNeededKwh = vehicle.batteryCapacity * 0.7;
                // Time (h) = Energy (kWh) / Power (kW)
                const chargingTimeHours = chargeNeededKwh / bestStation.power;
                totalChargingTimeSeconds += chargingTimeHours * 3600;

                // After charging, our range is reset to full.
                currentChargeKm = vehicleMaxRangeKm;
            } else {
                // Could not find an available station. For now, we'll just continue,
                // but a real app might alert the user or try a wider search.
                console.warn("Could not find any available charging stations near", searchPoint);
            }
        }
        
        // "Consume" the energy for this step
        currentChargeKm -= stepDistanceKm;
    }

    // The stations are already pre-sorted by the findStations flow, 
    // but we can re-sort here if needed, or just take the ones we found.
    const requiredChargingStations = stationsOnRoute;

    const totalDriveDurationSeconds = leg.duration?.value || 0;
    const totalDurationSeconds = totalDriveDurationSeconds + totalChargingTimeSeconds;
    const totalDistanceMeters = leg.distance?.value || 0;

    return {
      route: directionsResult,
      requiredChargingStations: requiredChargingStations,
      totalDistance: totalDistanceMeters,
      totalDuration: totalDurationSeconds,
    };
  }
);

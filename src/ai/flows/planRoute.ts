
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
    
    // Simplified range: uses 1kWh for 5km as a rough estimate
    const vehicleMaxRangeKm = vehicle.batteryCapacity * 5; 
    const safetyBufferKm = 50; // Leave a 50km buffer
    let currentChargeKm = vehicleMaxRangeKm * (vehicle.currentCharge / 100);
    
    let requiredStations: Station[] = [];
    let totalChargingTimeSeconds = 0;

    if (!leg.steps || leg.steps.length === 0) {
        return {
            route: directionsResult,
            requiredChargingStations: [],
            allNearbyStations: [],
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

            // Add all found stations to our list of potential stops
            nearbyStations.forEach(s => {
                if (!requiredStations.some(rs => rs.id === s.id)) {
                    requiredStations.push(s);
                }
            });

            const bestStation = nearbyStations.find(s => s.status === 'available');

            if (bestStation) {
                // Estimate charging time.
                // Assuming we charge from ~10% to 80% (a 70% charge)
                const chargeNeededKwh = vehicle.batteryCapacity * 0.7;
                // Time (h) = Energy (kWh) / Power (kW)
                const chargingTimeHours = chargeNeededKwh / bestStation.power;
                totalChargingTimeSeconds += chargingTimeHours * 3600;

                // Simulate a full recharge after finding stations
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

    // Sort all found stations to prioritize the best ones.
    requiredStations.sort((a, b) => {
        if (a.status === 'available' && b.status !== 'available') return -1;
        if (a.status !== 'available' && b.status === 'available') return 1;
        if (a.power !== b.power) return b.power - a.power; // Higher power is better
        return a.distance - b.distance; // Closer is better
    });

    // Filter down to the best 3 required stations.
    const bestRequiredStations = requiredStations.slice(0, 3);

    const totalDriveDurationSeconds = leg.duration?.value || 0;
    const totalDurationSeconds = totalDriveDurationSeconds + totalChargingTimeSeconds;
    const totalDistanceMeters = leg.distance?.value || 0;


    return {
      route: directionsResult,
      requiredChargingStations: bestRequiredStations,
      allNearbyStations: [], // We no longer need to return all nearby stations
      totalDistance: totalDistanceMeters,
      totalDuration: totalDurationSeconds,
    };
  }
);

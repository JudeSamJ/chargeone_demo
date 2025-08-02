
'use server';
/**
 * @fileOverview A flow to find nearby charging stations.
 */

import { ai } from '@/ai/genkit';
import { Station, FindStationsInputSchema, FindStationsOutputSchema, FindStationsInput, StationSchema } from '@/lib/types';
import { findPlace } from '@/lib/google-maps';

export async function findStations(input: FindStationsInput): Promise<Station[]> {
  return findStationsFlow(input);
}

const findStationsFlow = ai.defineFlow(
  {
    name: 'findStationsFlow',
    inputSchema: FindStationsInputSchema,
    outputSchema: FindStationsOutputSchema,
  },
  async ({ latitude, longitude, radius }) => {
    
    const places = await findPlace({
        // Updated query to be more specific for EV stations.
        query: 'electric vehicle charging station',
        location: { lat: latitude, lng: longitude },
        radius
    });

    if (!places || places.length === 0) {
        return [];
    }

    const stations: Station[] = places.map((p: any) => {
      // Use business_status for a more reliable operational check.
      const isOperational = p.business_status === 'OPERATIONAL';
      let status: 'available' | 'in-use' | 'unavailable' = 'unavailable';
      if (isOperational) {
        // Simulate some stations being in-use for demonstration.
        // In a real app, this would come from a dedicated EV charging API.
        status = Math.random() > 0.3 ? 'available' : 'in-use';
      }

      return {
        id: p.place_id,
        name: p.name,
        location: p.vicinity || p.name, 
        vicinity: p.vicinity,
        distance: 0, // Distance can be calculated on the client if needed.
        // Simulate power levels as this isn't in the standard Places API response.
        power: [50, 75, 150, 350][Math.floor(Math.random() * 4)],
        pricePerKwh: 18.50, // Placeholder price
        // Assuming CCS is common, can be expanded.
        connectors: ['CCS'],
        status: status,
        // Simulate slot booking capability.
        hasSlotBooking: Math.random() > 0.5,
        lat: p.geometry?.location?.lat,
        lng: p.geometry?.location?.lng,
      };
    }).filter((station: any): station is Station => {
        // Ensure we only include stations with valid coordinates and that they
        // conform to our data schema.
        if (!station.lat || !station.lng) return false;
        return StationSchema.safeParse(station).success;
    });
    
    // Sort stations to show available ones with higher power first.
    stations.sort((a, b) => {
        if (a.status === 'available' && b.status !== 'available') return -1;
        if (a.status !== 'available' && b.status === 'available') return 1;
        return b.power - a.power;
    });

    return stations;
  }
);

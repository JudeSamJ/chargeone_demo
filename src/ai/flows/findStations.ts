
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
        query: 'EV charging station',
        location: { lat: latitude, lng: longitude },
        radius
    });

    if (!places || places.length === 0) {
        return [];
    }

    const stations: Station[] = places.map((p: any) => {
      const isOperational = p.opening_hours?.open_now ?? (p.business_status === 'OPERATIONAL');
      let status: 'available' | 'in-use' | 'unavailable' = 'unavailable';
      if (isOperational) {
        // Simulate some stations being in-use
        status = Math.random() > 0.3 ? 'available' : 'in-use';
      }

      return {
        id: p.place_id,
        name: p.name,
        location: p.vicinity, 
        vicinity: p.vicinity,
        distance: 0, 
        power: 50,
        pricePerKwh: 18.50,
        connectors: ['CCS'],
        status: status,
        lat: p.geometry?.location?.lat,
        lng: p.geometry?.location?.lng,
      };
    }).filter((station: any): station is Station => {
        if (!station.lat || !station.lng) return false;
        
        // Ensure the mapped station conforms to the Zod schema
        return StationSchema.safeParse(station).success;
    });
    
    return stations;
  }
);

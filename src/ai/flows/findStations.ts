
'use server';
/**
 * @fileOverview A flow to find nearby charging stations.
 */

import { ai } from '@/ai/genkit';
import { Station, FindStationsInputSchema, FindStationsOutputSchema, FindStationsInput, StationSchema } from '@/lib/types';
import { findPlace, getPlaceDetails } from '@/lib/google-maps';
import { z } from 'genkit';

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

    const stations: Station[] = places.map((p: any) => ({
      id: p.place_id,
      name: p.name,
      location: p.vicinity,
      distance: 0, 
      power: 50, 
      pricePerKwh: 18.50,
      connectors: ['CCS'],
      isAvailable: p.opening_hours?.open_now || false,
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
    }));
    
    // Filter out any stations that don't conform to the schema after mapping
    // This is a safe-guard against bad data from the API
    return stations.filter(station => StationSchema.safeParse(station).success);
  }
);


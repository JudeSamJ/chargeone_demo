
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

    // Get details for each place
    const detailedPlaces = await Promise.all(
        places.filter(p => p.place_id).map(place => getPlaceDetails(place.place_id!))
    );

    // Format into our Station type
    const stations: Station[] = detailedPlaces.filter(p => p && p.geometry).map((p: any) => ({
      id: p.place_id,
      name: p.name,
      location: p.vicinity,
      distance: 0, // This would need to be calculated separately if needed
      power: 50, // Placeholder
      pricePerKwh: 18.50, // Placeholder
      connectors: ['CCS'], // Placeholder
      isAvailable: p.opening_hours?.open_now || false,
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
    }));
    
    // Filter out any stations that don't conform to the schema after mapping
    return stations.filter(station => StationSchema.safeParse(station).success);
  }
);

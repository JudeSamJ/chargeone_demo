
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

    // Directly map and filter valid stations
    const stations: Station[] = places.map((p: any) => ({
      id: p.place_id,
      name: p.name,
      location: p.vicinity, // Use vicinity for the main location string
      vicinity: p.vicinity,
      distance: 0, // This can be calculated on the client if needed
      power: 50, // Placeholder, not provided by API
      pricePerKwh: 18.50, // Placeholder
      connectors: ['CCS'], // Placeholder
      isAvailable: p.opening_hours?.open_now ?? (p.business_status === 'OPERATIONAL'), // Use ?? for better null/undefined handling
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
    })).filter((station: any): station is Station => {
        // Ensure that any station without a valid lat/lng is filtered out
        if (!station.lat || !station.lng) return false;
        
        // This safe-guard ensures that any station that doesn't conform to the schema after mapping is filtered out.
        // This is crucial for preventing bad data from the API from crashing the app.
        return StationSchema.safeParse(station).success;
    });
    
    return stations;
  }
);
'use server';
/**
 * @fileOverview A tool to find nearby EV charging stations using the Google Places API.
 *
 * - findStationsTool - A Genkit tool that fetches station data.
 * - findStations - A function that fetches station data.
 * - FindStationsInput - The input type for the findStations function.
 * - Station[] - The return type for the findStations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Station } from '@/lib/types';

const FindStationsInputSchema = z.object({
  lat: z.number().describe('Latitude of the center point for the search.'),
  lng: z.number().describe('Longitude of the center point for the search.'),
  radius: z.number().optional().describe('Search radius in meters. Defaults to 50000.'),
});

export type FindStationsInput = z.infer<typeof FindStationsInputSchema>;

// Note: The API key is defined in the flow for simplicity in this prototype.
// In a production app, this should be handled more securely.
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function findStations(input: FindStationsInput): Promise<Station[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured.');
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.append('location', `${input.lat},${input.lng}`);
  url.searchParams.append('radius', (input.radius || 50000).toString());
  url.searchParams.append('keyword', 'ev charging station');
  url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Places API request failed with status:', response.status, 'and body:', errorBody);
      throw new Error(`Google Places API request failed: ${response.statusText}`);
    }
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Places API error:', data.status, data.error_message);
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
    
    if (!data.results) {
        return [];
    }

    return data.results.map((place: any): Station => ({
      id: place.place_id,
      name: place.name,
      location: place.vicinity,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      isAvailable: place.business_status === 'OPERATIONAL',
      // The following are placeholders as Places API doesn't provide them directly
      distance: 0,
      power: 50,
      pricePerKwh: 20.0,
      connectors: ['CCS', 'Type 2'],
    }));
  } catch (error) {
    console.error('An error occurred while fetching stations:', error);
    throw error;
  }
}

export const findStationsTool = ai.defineTool(
  {
    name: 'findStationsTool',
    description: 'Finds EV charging stations near a given latitude and longitude.',
    inputSchema: FindStationsInputSchema,
    outputSchema: z.array(z.any()),
  },
  async (input) => {
    return findStations(input);
  }
);

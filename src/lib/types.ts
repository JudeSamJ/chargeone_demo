
import { z } from 'genkit';

export interface Vehicle {
  make: string;
  model: string;
  batteryCapacity: number; // in kWh
  currentCharge: number; // in %
}

export const StationSchema = z.object({
  id: z.string(), // Place ID from Google
  name:z.string(),
  location: z.string(), // Vicinity/address from Google
  vicinity: z.string().optional(),
  distance: z.number(), // in km
  power: z.number(), // in kW - Note: This is a placeholder as Places API doesn't provide it
  pricePerKwh: z.number(), // in currency - Note: This is a placeholder
  connectors: z.array(z.enum(['CCS', 'CHAdeMO', 'Type 2'])), // Placeholder
  status: z.enum(['available', 'in-use', 'unavailable']),
  lat: z.number(),
  lng: z.number(),
});

export type Station = z.infer<typeof StationSchema>;

export const FindStationsInputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().default(10000), // 10km
});
export type FindStationsInput = z.infer<typeof FindStationsInputSchema>;

export const FindStationsOutputSchema = z.array(StationSchema);

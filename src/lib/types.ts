
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
  status: z.enum(['available', 'in-use', 'unavailable']), // 'available', 'in-use', or 'unavailable'
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


export const PlanRouteInputSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  vehicle: z.custom<Vehicle>(),
});

// The output from google.maps.DirectionsResult is complex, so we use z.any()
// and cast it in the component.
export const PlanRouteOutputSchema = z.object({
  route: z.any(),
  chargingStations: z.array(z.custom<Station>()),
});

export type PlanRouteInput = z.infer<typeof PlanRouteInputSchema>;
export type PlanRouteOutput = z.infer<typeof PlanRouteOutputSchema>;

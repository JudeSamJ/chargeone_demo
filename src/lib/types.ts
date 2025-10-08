
import { z } from 'genkit';

export interface Vehicle {
  make: string;
  model: string;
  batteryCapacity: number; // in kWh
  currentCharge: number; // in %
  supportedChargers: string[]; // e.g., ["CCS", "CHADEMO"]
}

export const StationSchema = z.object({
  id: z.string(), // Place ID from Google
  name:z.string(),
  location: z.string(), // Vicinity/address from Google
  vicinity: z.string().optional(),
  distance: z.number(), // in km
  power: z.number(), // in kW - Note: This is a placeholder as Places API doesn't provide it
  pricePerKwh: z.number(), // in currency - Note: This is a placeholder
  connectors: z.array(z.string()), // Updated to be more flexible
  status: z.enum(['available', 'in-use', 'unavailable']), // 'available', 'in-use', or 'unavailable'
  hasSlotBooking: z.boolean().default(false),
  lat: z.number(),
  lng: z.number(),
});

export type Station = z.infer<typeof StationSchema>;

export interface Booking {
    id: string; // Firestore document ID
    userId: string;
    stationId: string;
    stationName: string;
    bookingTime: Date;
    createdAt: Date;
}

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
// and cast it in the component. We add points to the overview_polyline for decoding.
export const PlanRouteOutputSchema = z.object({
    route: z.any().refine(data => 
        data && 
        data.routes && 
        data.routes.length > 0 && 
        data.routes[0].overview_polyline && 
        typeof data.routes[0].overview_polyline.points === 'string', 
        { message: "Route must have a valid encoded polyline." }
    ),
    requiredChargingStations: z.array(StationSchema),
    totalDistance: z.number(), // in meters
    totalDuration: z.number(), // in seconds, including charging time
});

export type PlanRouteInput = z.infer<typeof PlanRouteInputSchema>;
export type PlanRouteOutput = z.infer<typeof PlanRouteOutputSchema>;

export const RecognizeVehicleInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a vehicle, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeVehicleInput = z.infer<typeof RecognizeVehicleInputSchema>;

export const RecognizeVehicleOutputSchema = z.object({
  make: z.string().describe('The make of the identified vehicle (e.g., "Tesla").'),
  model: z.string().describe('The model of the identified vehicle (e.g., "Model Y").'),
});
export type RecognizeVehicleOutput = z.infer<typeof RecognizeVehicleOutputSchema>;

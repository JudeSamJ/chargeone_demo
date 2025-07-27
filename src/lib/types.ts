export interface Vehicle {
  make: string;
  model: string;
  batteryCapacity: number; // in kWh
  currentCharge: number; // in %
}

export interface Station {
  id: string; // Place ID from Google
  name:string;
  location: string; // Vicinity/address from Google
  distance: number; // in km
  power: number; // in kW - Note: This is a placeholder as Places API doesn't provide it
  pricePerKwh: number; // in currency - Note: This is a placeholder
  connectors: ('CCS' | 'CHAdeMO' | 'Type 2')[]; // Placeholder
  isAvailable: boolean; // True if business_status is OPERATIONAL
  lat: number;
  lng: number;
}

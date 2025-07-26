export interface Vehicle {
  make: string;
  model: string;
  batteryCapacity: number; // in kWh
  currentCharge: number; // in %
}

export interface Station {
  id: number;
  name: string;
  location: string;
  distance: number; // in km
  power: number; // in kW
  pricePerKwh: number; // in currency
  connectors: ('CCS' | 'CHAdeMO' | 'Type 2')[];
  isAvailable: boolean;
}

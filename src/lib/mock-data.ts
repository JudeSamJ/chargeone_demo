import type { Vehicle } from './types';

export const defaultVehicle: Vehicle = {
  make: 'Tesla',
  model: 'Model Y',
  batteryCapacity: 75,
  currentCharge: 65,
  supportedChargers: ['CCS-2', 'Type-2'],
};

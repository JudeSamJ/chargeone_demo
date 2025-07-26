import type { Vehicle, Station } from './types';

export const userVehicle: Vehicle = {
  make: 'Tesla',
  model: 'Model Y',
  batteryCapacity: 75,
  currentCharge: 65,
};

export const availableStations: Station[] = [
  {
    id: 1,
    name: 'City Center Supercharger',
    location: '123 Main St, Downtown',
    distance: 2.5,
    power: 150,
    pricePerKwh: 0.45,
    connectors: ['CCS', 'Type 2'],
    isAvailable: true,
    lat: 34.052235,
    lng: -118.243683,
  },
  {
    id: 2,
    name: 'Mall Parking Charger',
    location: '456 Oak Ave, Shopping Mall',
    distance: 5.1,
    power: 50,
    pricePerKwh: 0.30,
    connectors: ['CHAdeMO', 'Type 2'],
    isAvailable: true,
    lat: 34.056,
    lng: -118.25,
  },
  {
    id: 3,
    name: 'Highway Rest Stop FastCharge',
    location: 'Hwy 101, Mile 88',
    distance: 12.8,
    power: 250,
    pricePerKwh: 0.55,
    connectors: ['CCS'],
    isAvailable: false,
    lat: 34.1,
    lng: -118.3,
  },
  {
    id: 4,
    name: 'Community Library Charger',
    location: '789 Pine Ln, Suburbia',
    distance: 3.2,
    power: 22,
    pricePerKwh: 0.25,
    connectors: ['Type 2'],
    isAvailable: true,
    lat: 34.04,
    lng: -118.2,
  },
];

"use client";

import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import type { Station } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';

interface MapViewProps {
    stations: Station[];
    onSelectStation: (station: Station) => void;
    selectedStationId?: number | null;
}

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

const center = {
  lat: 20.5937,
  lng: 78.9629
};

const apiKey = "PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE";

export default function MapView({ stations, onSelectStation, selectedStationId }: MapViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  });
  
  if (loadError) {
     return (
        <Card>
            <CardHeader>
                <CardTitle>Nearby Stations Map</CardTitle>
            </CardHeader>
            <CardContent>
                <div style={containerStyle} className="bg-destructive/20 text-destructive border border-destructive rounded-lg flex flex-col items-center justify-center text-center p-4">
                    <p className="font-medium">Map Error</p>
                    <p className="text-sm">Could not load Google Maps. Please ensure you have provided a valid API key.</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  if (!isLoaded) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Nearby Stations Map</CardTitle>
            </CardHeader>
            <CardContent>
                <div style={containerStyle} className="bg-muted flex items-center justify-center">
                    <p>Loading Map...</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Nearby Stations Map</CardTitle>
        </CardHeader>
        <CardContent>
             <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={5}
              >
                {stations.map(station => (
                  <MarkerF
                    key={station.id}
                    position={{ lat: station.lat, lng: station.lng }}
                    onClick={() => onSelectStation(station)}
                    label={station.name}
                    icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: station.id === selectedStationId ? 10 : 7,
                        fillColor: station.isAvailable ? "#10B981" : "#EF4444",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#ffffff"
                    }}
                  />
                ))}
              </GoogleMap>
        </CardContent>
    </Card>
  )
}

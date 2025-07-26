"use client";

import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import type { Station } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  lat: 34.0522,
  lng: -118.2437
};

export default function MapView({ stations, onSelectStation, selectedStationId }: MapViewProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  })

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
    )
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
                zoom={10}
              >
                {stations.map(station => (
                  <MarkerF
                    key={station.id}
                    position={{ lat: station.lat, lng: station.lng }}
                    onClick={() => onSelectStation(station)}
                    label={station.name}
                    icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: station.id === selectedStationId ? 12 : 8,
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

"use client";

import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import type { Station } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { findStations } from '@/ai/flows/findStations';

interface MapViewProps {
    stations: Station[];
    onStationsLoaded: (stations: Station[]) => void;
    onSelectStation: (station: Station) => void;
    selectedStationId?: string | null;
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

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function MapView({ stations, onStationsLoaded, onSelectStation, selectedStationId }: MapViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const fetchedStations = await findStations({ lat: center.lat, lng: center.lng });
        onStationsLoaded(fetchedStations);
        setError(null);
      } catch (err) {
        console.error("Error fetching stations:", err);
        setError("Could not load station data. Please ensure the Places API is enabled for your API key.");
      }
    };

    if (isLoaded && !error) {
        fetchStations();
    }
  }, [isLoaded, onStationsLoaded, error]);

  if (loadError || error) {
     return (
        <Card>
            <CardHeader>
                <CardTitle>Nearby Stations Map</CardTitle>
            </CardHeader>
            <CardContent>
                <div style={containerStyle} className="bg-destructive/20 text-destructive border border-destructive rounded-lg flex flex-col items-center justify-center text-center p-4">
                    <p className="font-medium">Map Error</p>
                    <p className="text-sm">{error || loadError?.message}</p>
                    {!apiKey && <p className="text-xs mt-2">API Key not provided. Please add it to your environment file.</p>}
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
                    title={station.name}
                    icon={{
                        path: typeof window !== 'undefined' ? window.google.maps.SymbolPath.CIRCLE : '',
                        scale: station.id === selectedStationId ? 10 : 7,
                        fillColor: station.isAvailable ? "#10B981" : "#F59E0B",
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

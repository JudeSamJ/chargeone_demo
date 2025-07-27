"use client";

import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import type { Station } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect, useRef, useCallback } from 'react';
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

// Center of Tamil Nadu
const initialCenter = {
  lat: 11.1271,
  lng: 78.6569
};

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function MapView({ stations, onStationsLoaded, onSelectStation, selectedStationId }: MapViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places'],
  });
  
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStationsForCenter = useCallback(async (center: { lat: number, lng: number }) => {
      try {
        const fetchedStations = await findStations({ lat: center.lat, lng: center.lng });
        // To avoid duplicates, we'll create a map of existing station IDs
        const existingStationIds = new Set(stations.map(s => s.id));
        const newStations = fetchedStations.filter(s => !existingStationIds.has(s.id));
        onStationsLoaded([...stations, ...newStations]);
        setError(null);
      } catch (err) {
        console.error("Error fetching stations:", err);
        setError("Could not load station data. Please ensure the Places API is enabled for your API key.");
      }
  }, [onStationsLoaded, stations]);


  const onMapIdle = useCallback(() => {
    if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
        if (mapRef.current) {
            const newCenter = mapRef.current.getCenter();
            if (newCenter) {
                fetchStationsForCenter({ lat: newCenter.lat(), lng: newCenter.lng() });
            }
        }
    }, 500); // Debounce requests to avoid too many API calls
    
  }, [fetchStationsForCenter]);


  const onLoad = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
    // Initial fetch
    fetchStationsForCenter(initialCenter);
  }, [fetchStationsForCenter]);

  useEffect(() => {
    // Cleanup timeout on component unmount
    return () => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
    }
  }, []);


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
                center={initialCenter}
                zoom={7}
                onLoad={onLoad}
                onIdle={onMapIdle}
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

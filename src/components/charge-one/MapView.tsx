"use client";

import { GoogleMap, MarkerF, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';
import type { Station } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useRef, useCallback, useEffect } from 'react';
import { findStations } from '@/ai/flows/findStations';

interface MapViewProps {
    stations: Station[];
    onStationsLoaded: (stations: Station[]) => void;
    onSelectStation: (station: Station) => void;
    selectedStationId?: string | null;
    initialCenter: { lat: number, lng: number };
    directions?: any;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '600px',
  borderRadius: '0.5rem',
};

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function MapView({ 
    stations, 
    onStationsLoaded, 
    onSelectStation, 
    selectedStationId,
    initialCenter,
    directions 
}: MapViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places', 'routes'],
  });
  
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentCenter, setCurrentCenter] = useState(initialCenter);

  const fetchStationsForCenter = useCallback(async (center: { lat: number, lng: number }) => {
      try {
        const fetchedStations = await findStations({ lat: center.lat, lng: center.lng });
        
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
        if (mapRef.current && !directions) { 
            const newCenter = mapRef.current.getCenter();
            if (newCenter) {
                const newCenterCoords = { lat: newCenter.lat(), lng: newCenter.lng() };
                setCurrentCenter(newCenterCoords);
                fetchStationsForCenter(newCenterCoords);
            }
        }
    }, 500); 
    
  }, [fetchStationsForCenter, directions]);


  const onLoad = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
    fetchStationsForCenter(initialCenter);
  }, [fetchStationsForCenter, initialCenter]);

  useEffect(() => {
    return () => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
    }
  }, []);

  useEffect(() => {
    if (directions && mapRef.current && directions.routes && directions.routes.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        directions.routes[0].legs.forEach((leg: any) => {
            leg.steps.forEach((step: any) => {
                if (step.path) {
                    step.path.forEach((p: any) => bounds.extend(p));
                }
            });
        });
        mapRef.current.fitBounds(bounds);
    }
  }, [directions]);


  if (loadError || error) {
     return (
        <Card className="h-full">
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
        <Card className="h-full">
            <CardContent>
                <div style={containerStyle} className="bg-muted flex items-center justify-center">
                    <p>Loading Map...</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="h-full">
        <CardContent className="p-0 h-full">
             <GoogleMap
                mapContainerStyle={containerStyle}
                center={currentCenter}
                zoom={10}
                onLoad={onLoad}
                onIdle={onMapIdle}
                options={{
                    mapId: 'f9496b627755255d', 
                    disableDefaultUI: true,
                    zoomControl: true,
                }}
              >
                {directions ? (
                    <DirectionsRenderer 
                        directions={directions} 
                        options={{
                            suppressMarkers: true,
                            polylineOptions: {
                                strokeColor: '#1976D2',
                                strokeWeight: 6,
                            }
                        }}
                    />
                ) : (
                    <>
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
                    </>
                )}
              </GoogleMap>
        </CardContent>
    </Card>
  )
}

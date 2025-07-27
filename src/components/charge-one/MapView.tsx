
"use client";

import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import { mapStyles } from '@/lib/map-styles';
import { useCallback, useEffect, useRef, useState } from 'react';
import { findStations } from '@/ai/flows/findStations';
import type { Station } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const mapContainerStyle = {
  width: '100vw',
  height: '100vh',
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090
};

interface MapViewProps {
  onStationsFound: (stations: Station[]) => void;
  onStationClick: (station: Station) => void;
  stations: Station[];
  route: google.maps.DirectionsResult | null;
}

export default function MapView({ onStationsFound, stations, onStationClick, route }: MapViewProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ['places'],
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const [center, setCenter] = useState(defaultCenter);
    const { toast } = useToast();

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        // Get user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const currentPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setCenter(currentPosition);
                    map.panTo(currentPosition);
                    map.setZoom(14);
                    // Find stations near the user's location
                    findStations({ latitude: currentPosition.lat, longitude: currentPosition.lng, radius: 10000 })
                        .then(onStationsFound)
                        .catch(err => {
                            console.error("Error finding stations:", err);
                            toast({ variant: 'destructive', title: 'Could not find nearby stations.'});
                        });
                },
                () => {
                    // Geolocation failed, use default center
                    toast({ title: 'Could not get your location.' });
                    findStations({ latitude: defaultCenter.lat, longitude: defaultCenter.lng, radius: 10000 })
                       .then(onStationsFound)
                       .catch(err => {
                           console.error("Error finding stations:", err);
                           toast({ variant: 'destructive', title: 'Could not find nearby stations.'});
                       });
                }
            );
        }
    }, [onStationsFound, toast]);

    if (loadError) return <div className="flex items-center justify-center h-screen w-screen bg-muted rounded-lg"><p>Error loading map</p></div>;
    if (!isLoaded) return <div className="flex items-center justify-center h-screen w-screen bg-muted rounded-lg"><p>Loading Map...</p></div>;

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={12}
            onLoad={onMapLoad}
            options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: mapStyles,
            }}
        >
            {route ? (
                <DirectionsRenderer directions={route} />
            ) : (
                stations.map(station => (
                    <MarkerF
                        key={station.id}
                        position={{ lat: station.lat, lng: station.lng }}
                        title={station.name}
                        icon={{
                            url: station.isAvailable ? '/green-dot.png' : '/red-dot.png',
                            scaledSize: new google.maps.Size(20, 20),
                        }}
                        onClick={() => onStationClick(station)}
                    />
                ))
            )}
        </GoogleMap>
    );
}

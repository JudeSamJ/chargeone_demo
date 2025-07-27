
"use client";

import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { findStations } from '@/ai/flows/findStations';
import type { Station } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { mapStyles } from '@/lib/map-styles';

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

    const [center, setCenter] = useState(defaultCenter);
    const { toast } = useToast();
    const mapRef = useRef<google.maps.Map | null>(null);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
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
                    findStations({ latitude: currentPosition.lat, longitude: currentPosition.lng, radius: 10000 })
                        .then(onStationsFound)
                        .catch(err => {
                            console.error("Error finding stations:", err);
                            toast({ variant: 'destructive', title: 'Could not find nearby stations.'});
                        });
                },
                () => {
                    toast({ title: 'Could not get your location. Showing default.' });
                    findStations({ latitude: defaultCenter.lat, longitude: defaultCenter.lng, radius: 10000 })
                       .then(onStationsFound)
                       .catch(err => {
                           console.error("Error finding stations:", err);
                           toast({ variant: 'destructive', title: 'Could not find stations near default location.'});
                       });
                }
            );
        } else {
             toast({ title: 'Geolocation not supported. Showing default location.' });
             findStations({ latitude: defaultCenter.lat, longitude: defaultCenter.lng, radius: 10000 })
                .then(onStationsFound)
                .catch(err => {
                    console.error("Error finding stations:", err);
                    toast({ variant: 'destructive', title: 'Could not find stations near default location.'});
                });
        }
    }, [onStationsFound, toast]);

    useEffect(() => {
        if (route && mapRef.current) {
            const bounds = new google.maps.LatLngBounds();
            if (route.routes[0]?.bounds) {
                // The API returns a LatLngBoundsLiteral, which needs to be converted.
                const routeBounds = route.routes[0].bounds;
                const ne = routeBounds.northeast;
                const sw = routeBounds.southwest;
                const newBounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng(sw.lat, sw.lng),
                    new google.maps.LatLng(ne.lat, ne.lng)
                );
                bounds.union(newBounds);
            }
            if (!bounds.isEmpty()) {
              mapRef.current.fitBounds(bounds);
            }
        }
    }, [route]);


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
           {stations.map(station => (
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
            ))}
        </GoogleMap>
    );
}

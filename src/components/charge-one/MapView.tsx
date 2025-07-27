
"use client";

import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer } from '@react-google-maps/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { findStations } from '@/ai/flows/findStations';
import type { Station } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { mapStylesLight } from '@/lib/map-styles-light';
import { mapStylesDark } from '@/lib/map-styles-dark';


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
    const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const { toast } = useToast();
    const mapRef = useRef<google.maps.Map | null>(null);
    const { theme } = useTheme();

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const currentPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setCurrentLocation(currentPosition);
                    setCenter(currentPosition); // Pan map to current location
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
                    setCurrentLocation(defaultCenter);
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
             setCurrentLocation(defaultCenter);
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
                const routeBounds = route.routes[0].bounds;
                // The DirectionsResult bounds object is a LatLngBoundsLiteral, not a LatLngBounds object
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
                styles: theme === 'dark' ? mapStylesDark : mapStylesLight,
                tilt: 45,
            }}
        >
            {isLoaded && (
              <>
                {/* Marker for current location */}
                {currentLocation && (
                  <MarkerF
                      position={currentLocation}
                      title="Your Location"
                      icon={{
                          path: google.maps.SymbolPath.CIRCLE,
                          fillColor: '#4285F4',
                          fillOpacity: 1,
                          strokeColor: '#ffffff',
                          strokeWeight: 2,
                          scale: 8,
                      }}
                  />
                )}
                
                {/* Markers for EV stations */}
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

                {/* Renderer for the planned route */}
                {route && (
                  <DirectionsRenderer
                      directions={route}
                      options={{
                          suppressMarkers: true,
                          polylineOptions: {
                              strokeColor: 'hsl(var(--primary))',
                              strokeWeight: 5,
                          }
                      }}
                  />
                )}
              </>
            )}
        </GoogleMap>
    );
}

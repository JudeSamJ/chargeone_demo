
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
  onLocationUpdate: (location: google.maps.LatLngLiteral) => void;
}

export default function MapView({ onStationsFound, stations, onStationClick, route, onLocationUpdate }: MapViewProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ['places'],
    });
    
    const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const [center, setCenter] = useState(defaultCenter);
    const [destinationLocation, setDestinationLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const { toast } = useToast();
    const mapRef = useRef<google.maps.Map | null>(null);
    const { theme } = useTheme();
    const stationsFetchedRef = useRef(false);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    useEffect(() => {
        if (!isLoaded) return;

        let watchId: number;

        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const currentPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setCurrentLocation(currentPosition);
                    onLocationUpdate(currentPosition);
                    
                    // Only pan to location if not actively viewing a route
                    if (!route) {
                        setCenter(currentPosition);
                        if(mapRef.current) {
                           mapRef.current.panTo(currentPosition);
                        }
                    }

                    // Fetch initial stations only once
                    if (!stationsFetchedRef.current) {
                        stationsFetchedRef.current = true;
                        findStations({ latitude: currentPosition.lat, longitude: currentPosition.lng, radius: 10000 })
                            .then(onStationsFound)
                            .catch(err => {
                                console.error("Error finding stations:", err);
                                toast({ variant: 'destructive', title: 'Could not find nearby stations.'});
                            });
                    }
                },
                () => {
                    toast({ title: 'Could not get your location. Showing default.' });
                     if (!stationsFetchedRef.current) {
                        stationsFetchedRef.current = true;
                        findStations({ latitude: defaultCenter.lat, longitude: defaultCenter.lng, radius: 10000 })
                           .then(onStationsFound)
                           .catch(err => {
                               console.error("Error finding stations:", err);
                               toast({ variant: 'destructive', title: 'Could not find stations near default location.'});
                           });
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        } else {
             toast({ title: 'Geolocation not supported. Showing default location.' });
             if (!stationsFetchedRef.current) {
                stationsFetchedRef.current = true;
                findStations({ latitude: defaultCenter.lat, longitude: defaultCenter.lng, radius: 10000 })
                    .then(onStationsFound)
                    .catch(err => {
                        console.error("Error finding stations:", err);
                        toast({ variant: 'destructive', title: 'Could not find stations near default location.'});
                    });
            }
        }

        return () => {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [isLoaded, onStationsFound, toast, route, onLocationUpdate]);


    useEffect(() => {
        if (route && mapRef.current && isLoaded) {
            const bounds = new google.maps.LatLngBounds();
            const routeLeg = route.routes[0]?.legs[0];

            if (routeLeg?.end_location) {
                setDestinationLocation({
                    lat: routeLeg.end_location.lat,
                    lng: routeLeg.end_location.lng,
                });
            } else {
                setDestinationLocation(null);
            }

            if (route.routes[0]?.bounds) {
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
        } else {
            setDestinationLocation(null);
        }
    }, [route, isLoaded]);

    const getStationMarkerIcon = (status: Station['status']) => {
        let color = '#808080'; // Grey for unavailable
        if (status === 'available') {
            color = '#10B981'; // Green
        } else if (status === 'in-use') {
            color = '#EF4444'; // Red
        }

        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
            scale: 7,
        };
    };


    if (loadError) return <div className="flex items-center justify-center h-screen w-screen bg-muted rounded-lg"><p>Error loading map</p></div>;
    if (!isLoaded) return <div className="flex items-center justify-center h-screen w-screen bg-muted rounded-lg"><p>Loading Map...</p></div>;

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={14}
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
                
                {stations.map(station => (
                    <MarkerF
                        key={station.id}
                        position={{ lat: station.lat, lng: station.lng }}
                        title={`${station.name} (${station.power}kW)`}
                        onClick={() => onStationClick(station)}
                        icon={getStationMarkerIcon(station.status)}
                    />
                ))}

                {route && (
                  <DirectionsRenderer
                      directions={route}
                      options={{
                          suppressMarkers: true, // We render our own markers
                          polylineOptions: {
                              strokeColor: '#4285F4',
                              strokeWeight: 6,
                          }
                      }}
                  />
                )}
                
                {destinationLocation && (
                    <MarkerF
                        position={destinationLocation}
                        title="Destination"
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: '#FBBF24', // Amber
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            scale: 12,
                        }}
                    />
                )}
              </>
            )}
        </GoogleMap>
    );
}

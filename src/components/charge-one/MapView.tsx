
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
  position: 'absolute' as const,
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
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
  currentLocation: google.maps.LatLngLiteral | null;
}

export default function MapView({ onStationsFound, stations, onStationClick, route, onLocationUpdate, currentLocation }: MapViewProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ['places'],
    });
    
    const [center, setCenter] = useState(defaultCenter);
    const { toast } = useToast();
    const mapRef = useRef<google.maps.Map | null>(null);
    const { theme } = useTheme();
    const stationsFetchedRef = useRef(false);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    useEffect(() => {
        let watchId: number;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const currentPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    onLocationUpdate(currentPos);
                    if (!route) { // Only center on user if there's no active route
                        setCenter(currentPos);
                    }
                    if (!stationsFetchedRef.current) {
                        stationsFetchedRef.current = true;
                        findStations({ latitude: currentPos.lat, longitude: currentPos.lng, radius: 10000 })
                            .then(onStationsFound)
                            .catch(err => {
                                console.error("Error finding stations:", err);
                                toast({ variant: 'destructive', title: 'Could not find nearby stations.'});
                            });
                    }
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    toast({ title: 'Could not get your location. Showing default.' });
                     if (!stationsFetchedRef.current) {
                        stationsFetchedRef.current = true;
                        findStations({ latitude: defaultCenter.lat, longitude: defaultCenter.lng, radius: 10000 })
                            .then(onStationsFound)
                            .catch(err => {
                                console.error("Error finding stations:", err);
                                toast({ variant: 'destructive', title: 'Could not find nearby stations.'});
                            });
                    }
                },
                { enableHighAccuracy: true }
            );
        } else {
             toast({ title: 'Geolocation not supported. Showing default location.' });
             if (!stationsFetchedRef.current) {
                stationsFetchedRef.current = true;
                findStations({ latitude: defaultCenter.lat, longitude: defaultCenter.lng, radius: 10000 })
                    .then(onStationsFound)
                    .catch(err => {
                        console.error("Error finding stations:", err);
                        toast({ variant: 'destructive', title: 'Could not find nearby stations.'});
                    });
            }
        }

        return () => {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [isLoaded, onLocationUpdate, toast, route, onStationsFound]);


    useEffect(() => {
        if (route && mapRef.current && isLoaded) {
            const bounds = new google.maps.LatLngBounds();
            
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

    const getDestinationMarkerIcon = () => {
      if (!isLoaded || !route) return null;
      
      const routeLeg = route.routes[0]?.legs[0];
      if (!routeLeg?.end_location) return null;

      return {
          position: routeLeg.end_location,
          icon: {
            path: 'M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z', 
            fillColor: '#FFD700',
            fillOpacity: 1,
            strokeColor: '#000000',
            strokeWeight: 1,
            scale: 1.5,
            anchor: new google.maps.Point(12, 12),
        }
      }
    };

    const destinationMarker = getDestinationMarkerIcon();

    if (loadError) return <div className="flex items-center justify-center h-full w-full bg-muted rounded-lg"><p>Error loading map</p></div>;
    if (!isLoaded) return <div className="flex items-center justify-center h-full w-full bg-muted rounded-lg"><p>Loading Map...</p></div>;

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
                        polylineOptions: {
                          strokeColor: '#1976D2',
                          strokeWeight: 6,
                          strokeOpacity: 0.8,
                        },
                        suppressMarkers: true,
                    }}
                  />
                )}
                
                {destinationMarker && (
                    <MarkerF
                        position={destinationMarker.position}
                        title="Destination"
                        icon={destinationMarker.icon}
                    />
                )}
                
              </>
            )}
        </GoogleMap>
    );
}

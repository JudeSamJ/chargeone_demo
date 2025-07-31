
"use client";

import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer, Polyline } from '@react-google-maps/api';
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

// Distance in meters from the route polyline to trigger a re-route
const REROUTE_THRESHOLD = 500; 

interface MapViewProps {
  onStationsFound: (stations: Station[]) => void;
  onStationClick: (station: Station) => void;
  stations: Station[];
  route: google.maps.DirectionsResult | null;
  onLocationUpdate: (location: google.maps.LatLngLiteral) => void;
  currentLocation: google.maps.LatLngLiteral | null;
  isJourneyStarted: boolean;
  onReRoute: (origin: string, destination: string) => void;
}

export default function MapView({ onStationsFound, stations, onStationClick, route, onLocationUpdate, currentLocation, isJourneyStarted, onReRoute }: MapViewProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ['places', 'geometry'], 
    });
    
    const [center, setCenter] = useState(defaultCenter);
    const { toast } = useToast();
    const mapRef = useRef<google.maps.Map | null>(null);
    const { theme } = useTheme();
    const stationsFetchedRef = useRef(false);
    const lastRerouteTimeRef = useRef<number>(0);
    const initialLocationSetRef = useRef(false);


    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    useEffect(() => {
        if (mapRef.current && currentLocation && !initialLocationSetRef.current) {
            mapRef.current.panTo(currentLocation);
            mapRef.current.setZoom(14);
            initialLocationSetRef.current = true;
        }
    }, [currentLocation]);

    useEffect(() => {
        if (isJourneyStarted && mapRef.current && currentLocation) {
            mapRef.current.panTo(currentLocation);
            mapRef.current.setZoom(16);
        }
    }, [isJourneyStarted, currentLocation]);

    useEffect(() => {
        if (!route) {
            stationsFetchedRef.current = false;
        }
    }, [route]);

    const decodedPath = route && isLoaded ? google.maps.geometry.encoding.decodePath(route.routes[0].overview_polyline.points) : [];

    useEffect(() => {
        let watchId: number;
        if (navigator.geolocation && isLoaded) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const currentPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    onLocationUpdate(currentPos);

                    // Re-routing logic
                    if (isJourneyStarted && route && decodedPath.length > 0) {
                        const now = Date.now();
                        // Throttle re-routing checks to every 10 seconds
                        if (now - lastRerouteTimeRef.current > 10000) {
                             const userLatLng = new google.maps.LatLng(currentPos.lat, currentPos.lng);
                             const distanceToRoute = google.maps.geometry.spherical.computeDistanceBetween(
                                userLatLng,
                                // Find closest point on path
                                new google.maps.Polyline({path: decodedPath}).getPath().getArray().reduce((prev, curr) => {
                                    const prevDistance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, prev);
                                    const currDistance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, curr);
                                    return prevDistance < currDistance ? prev : curr;
                                })
                             );

                            if (distanceToRoute > REROUTE_THRESHOLD && route.routes[0]?.legs[0]?.end_address) {
                                lastRerouteTimeRef.current = now;
                                toast({ title: "Off Route", description: "Recalculating..." });
                                const destination = route.routes[0].legs[0].end_address;
                                if (destination) {
                                    onReRoute(`${currentPos.lat},${currentPos.lng}`, destination);
                                }
                            }
                        }
                    }

                    if (!stationsFetchedRef.current && !route) {
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
                     if (!stationsFetchedRef.current && !route) {
                        stationsFetchedRef.current = true;
                        findStations({ latitude: defaultCenter.lat, longitude: defaultCenter.lng, radius: 10000 })
                            .then(onStationsFound)
                            .catch(err => {
                                console.error("Error finding stations:", err);
                                toast({ variant: 'destructive', title: 'Could not find nearby stations.'});
                            });
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else if (!navigator.geolocation) {
             toast({ title: 'Geolocation not supported. Showing default location.' });
             if (!stationsFetchedRef.current && !route) {
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
    }, [isLoaded, onLocationUpdate, toast, route, onStationsFound, isJourneyStarted, onReRoute, decodedPath]);


    useEffect(() => {
        if (route && mapRef.current && isLoaded) {
            const bounds = new google.maps.LatLngBounds();
            
            const routeBounds = route.routes[0]?.bounds;
            if (routeBounds) {
                const ne = routeBounds.northeast;
                const sw = routeBounds.southwest;
                bounds.extend(new google.maps.LatLng(ne.lat, ne.lng));
                bounds.extend(new google.maps.LatLng(sw.lat, sw.lng));
            }
            if (!bounds.isEmpty()) {
              mapRef.current.fitBounds(bounds);
            }
        }
    }, [route, isLoaded]);

    const getStationMarkerIcon = (status: Station['status']) => {
        if (!isLoaded) return null;
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
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#EA4335',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
            scale: 2,
            anchor: new google.maps.Point(12, 24),
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
                
                {decodedPath.length > 0 && (
                    <Polyline
                        path={decodedPath}
                        options={{
                          strokeColor: '#1976D2',
                          strokeWeight: 6,
                          strokeOpacity: 0.8,
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

    
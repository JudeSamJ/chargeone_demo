
"use client";

import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, Polyline, TrafficLayer } from '@react-google-maps/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { findStations } from '@/ai/flows/findStations';
import type { Station } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { mapStylesLight } from '@/lib/map-styles-light';
import { mapStylesDark } from '@/lib/map-styles-dark';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Zap, Plug, CircleDotDashed, CalendarCheck } from 'lucide-react';


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
  mapTypeId: string;
  showTraffic: boolean;
  bookedStationIds: string[];
}

export default function MapView({ 
    onStationsFound, 
    stations, 
    onStationClick, 
    route, 
    onLocationUpdate, 
    currentLocation, 
    isJourneyStarted, 
    onReRoute,
    mapTypeId,
    showTraffic,
    bookedStationIds
}: MapViewProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: "AIzaSyBMltP754BsiINUjJ90C0HE5YE0As2cTcc",
        libraries: ['places', 'geometry'], 
    });
    
    const [activeMarker, setActiveMarker] = useState<string | null>(null);
    const { toast } = useToast();
    const mapRef = useRef<google.maps.Map | null>(null);
    const { theme } = useTheme();
    const stationsFetchedRef = useRef(false);
    const lastRerouteTimeRef = useRef<number>(0);
    const initialLocationSetRef = useRef(false);
    const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const fetchStationsForView = useCallback(() => {
        if (!isLoaded || !mapRef.current || route) return;

        const map = mapRef.current;
        const center = map.getCenter();
        const bounds = map.getBounds();

        if (!center || !bounds) return;

        const centerLatLng = { lat: center.lat(), lng: center.lng() };
        
        // Calculate radius from bounds
        const ne = bounds.getNorthEast();
        const radius = google.maps.geometry.spherical.computeDistanceBetween(center, ne);
        
        findStations({ latitude: centerLatLng.lat, longitude: centerLatLng.lng, radius })
            .then(onStationsFound)
            .catch(err => {
                console.error("Error finding stations for view:", err);
                toast({ variant: 'destructive', title: 'Could not find nearby stations for the current view.'});
            });

    }, [isLoaded, route, onStationsFound, toast]);

    const handleMapIdle = useCallback(() => {
        if (idleTimeoutRef.current) {
            clearTimeout(idleTimeoutRef.current);
        }
        idleTimeoutRef.current = setTimeout(() => {
            fetchStationsForView();
        }, 500); // Debounce to avoid rapid firing
    }, [fetchStationsForView]);

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

    const getStationMarkerIcon = (station: Station) => {
        if (!isLoaded) return null;

        if (bookedStationIds.includes(station.id)) {
            return {
                path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14H11v-6h2v4h1.5v2z', // Clock icon path
                fillColor: '#3B82F6', // Blue-500
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 1.5,
                scale: 1.2,
                anchor: new google.maps.Point(12, 12),
            };
        }

        let color = '#808080'; // Grey for unavailable
        if (station.status === 'available') {
            color = '#10B981'; // Green
        } else if (station.status === 'in-use') {
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
    const mapThemeStyles = theme === 'dark' ? mapStylesDark : mapStylesLight;


    if (loadError) return <div className="flex items-center justify-center h-full w-full bg-muted rounded-lg"><p>Error loading map</p></div>;
    if (!isLoaded) return <div className="flex items-center justify-center h-full w-full bg-muted rounded-lg"><p>Loading Map...</p></div>;

    const activeStation = stations.find(s => s.id === activeMarker);

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={14}
            onLoad={onMapLoad}
            onIdle={handleMapIdle}
            mapTypeId={mapTypeId}
            options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: mapTypeId === 'roadmap' ? mapThemeStyles : undefined,
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
                        onMouseOver={() => setActiveMarker(station.id)}
                        onMouseOut={() => setActiveMarker(null)}
                        icon={getStationMarkerIcon(station)}
                    />
                ))}

                {activeStation && (
                    <InfoWindowF
                        position={{ lat: activeStation.lat, lng: activeStation.lng }}
                        onCloseClick={() => setActiveMarker(null)}
                        options={{ pixelOffset: new google.maps.Size(0, -30) }}
                    >
                        <div className="p-1 max-w-xs">
                           <h4 className="font-bold text-base mb-1">{activeStation.name}</h4>
                           <div className="flex flex-col gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <CircleDotDashed className="h-4 w-4 text-muted-foreground" /> 
                                    <Badge variant={activeStation.status === 'available' ? 'default' : 'destructive'} className="capitalize">
                                        {activeStation.status.replace('-', ' ')}
                                    </Badge>
                                </div>
                               <div className="flex items-center gap-2">
                                   <Zap className="h-4 w-4 text-muted-foreground" />
                                   <span>{activeStation.power} kW</span>
                               </div>
                               <div className="flex items-center gap-2">
                                   <Plug className="h-4 w-4 text-muted-foreground" />
                                   <div className="flex gap-1">
                                    {activeStation.connectors.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
                                   </div>
                               </div>
                               {activeStation.hasSlotBooking && (
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                                    <span>Slot booking available</span>
                                </div>
                               )}
                           </div>
                        </div>
                    </InfoWindowF>
                )}
                
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

                {showTraffic && <TrafficLayer autoUpdate />}
              </>
            )}
        </GoogleMap>
    );
}

    

"use client";

import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, Polyline, TrafficLayer } from '@react-google-maps/api';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { findStations } from '@/ai/flows/findStations';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { mapStylesLight } from '@/lib/map-styles-light';
import { mapStylesDark } from '@/lib/map-styles-dark';
import { Badge } from '../ui/badge';
import { Zap, Plug, CircleDotDashed, CalendarCheck } from 'lucide-react';

const mapContainerStyle = {
  position: 'absolute',
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
    bookedStationIds,
    requiredStationIds,
    setRecenterCallback
}) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: "AIzaSyBMltP754BsiINUjJ90C0HE5YE0As2cTcc",
        libraries: ['places', 'geometry'], 
    });
    
    const [activeMarker, setActiveMarker] = useState(null);
    const { toast } = useToast();
    const mapRef = useRef(null);
    const { theme } = useTheme();
    const lastRerouteTimeRef = useRef(0);
    const [locationReady, setLocationReady] = useState(false);
    const initialLocationSetRef = useRef(false);

    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
        setRecenterCallback(() => () => {
            if (mapRef.current && currentLocation) {
                mapRef.current.panTo(currentLocation);
                mapRef.current.setZoom(14);
            }
        });
    }, [currentLocation, setRecenterCallback]);

    const fetchStations = useCallback((lat, lng, radius) => {
        findStations({ latitude: lat, longitude: lng, radius })
            .then(onStationsFound)
            .catch(err => {
                console.error("Error finding stations:", err);
                toast({ variant: 'destructive', title: 'Could not find nearby stations.'});
            });
    }, [onStationsFound, toast]);

    useEffect(() => {
        if (!isLoaded) return;
    
        const handleLocationError = (error) => {
            console.error("Geolocation error:", error.message);
            toast({ title: "Could not get your location. Showing default." });
            if (!locationReady) {
                onLocationUpdate(defaultCenter); // Set default location on error
                setLocationReady(true);
                if (!route) {
                    fetchStations(defaultCenter.lat, defaultCenter.lng, 10000);
                }
            }
        };
    
        const updatePosition = () => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const currentPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    onLocationUpdate(currentPos);
                    
                    if (!locationReady) {
                        setLocationReady(true);
                    }
    
                    if (!initialLocationSetRef.current && mapRef.current) {
                        mapRef.current.panTo(currentPos);
                        mapRef.current.setZoom(14);
                        if (!route) {
                            fetchStations(currentPos.lat, currentPos.lng, 10000);
                        }
                        initialLocationSetRef.current = true;
                    }
                },
                handleLocationError,
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
        };
        
        updatePosition(); // Get initial position
        const intervalId = setInterval(updatePosition, 5000); // Update every 5 seconds
    
        return () => clearInterval(intervalId);
    }, [isLoaded, onLocationUpdate, route, fetchStations, toast, locationReady]);

    useEffect(() => {
        if (isJourneyStarted && mapRef.current && currentLocation) {
            mapRef.current.panTo(currentLocation);
            mapRef.current.setZoom(16);
        }
    }, [isJourneyStarted, currentLocation]);


    const decodedPath = useMemo(() => {
      if (route && isLoaded && route.routes[0]?.overview_polyline?.points) {
          return google.maps.geometry.encoding.decodePath(route.routes[0].overview_polyline.points);
      }
      return [];
    }, [route, isLoaded]);

    // Rerouting logic effect
    useEffect(() => {
        if (isJourneyStarted && route && currentLocation && decodedPath.length > 0) {
            const now = Date.now();
            if (now - lastRerouteTimeRef.current > 10000) { // Throttle rerouting checks
                const userLatLng = new google.maps.LatLng(currentLocation.lat, currentLocation.lng);
                
                if (google.maps.geometry.poly.isLocationOnEdge(userLatLng, new google.maps.Polyline({ path: decodedPath }), REROUTE_THRESHOLD / 1000) === false) {
                     const distanceToRoute = decodedPath.reduce((minDist, point) => {
                         const dist = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, point);
                         return Math.min(minDist, dist);
                     }, Infinity);

                     if (distanceToRoute > REROUTE_THRESHOLD) {
                        lastRerouteTimeRef.current = now;
                        toast({ title: "Off Route", description: "Recalculating..." });
                        const destination = route.routes[0].legs[0].end_address;
                        if (destination) {
                            onReRoute(`${currentLocation.lat},${currentLocation.lng}`, destination);
                        }
                     }
                }
            }
        }
    }, [isJourneyStarted, route, currentLocation, decodedPath, onReRoute, toast]);


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

    const getStationMarkerIcon = (station) => {
        if (!isLoaded) return null;

        if (requiredStationIds.includes(station.id)) {
            return {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#3b82f6', // A bright blue for required stations
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 9, // Make it slightly larger to stand out
            };
        }

        if (bookedStationIds.includes(station.id)) {
            return {
                path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14H11v-6h2v4h1.5v2z', // Clock icon path
                fillColor: '#10B981', // Green-500
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

    const getOriginMarkerIcon = () => {
        if (!isLoaded || !route) return null;

        const routeLeg = route.routes[0]?.legs[0];
        if (!routeLeg?.start_location) return null;

        return {
            position: routeLeg.start_location,
            icon: {
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5-2.5-1.12 2.5-2.5-2.5z', // Pin icon
                fillColor: '#4CAF50', // A shade of green for start
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 1.5,
                scale: 2,
                anchor: new google.maps.Point(12, 24),
            }
        };
    };
    
    const getDestinationMarkerIcon = () => {
      if (!isLoaded || !route) return null;
      
      const routeLeg = route.routes[0]?.legs[0];
      if (!routeLeg?.end_location) return null;

      return {
          position: routeLeg.end_location,
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5-2.5-1.12 2.5-2.5-2.5z',
            fillColor: '#EA4335',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
            scale: 2,
            anchor: new google.maps.Point(12, 24),
        }
      }
    };
    
    const originMarker = getOriginMarkerIcon();
    const destinationMarker = getDestinationMarkerIcon();
    const mapThemeStyles = theme === 'dark' ? mapStylesDark : mapStylesLight;


    if (loadError) return <div className="flex items-center justify-center h-full w-full bg-muted rounded-lg"><p>Error loading map</p></div>;
    if (!isLoaded || !locationReady) return <div className="flex items-center justify-center h-full w-full bg-muted rounded-lg"><p>Getting your location...</p></div>;
    
    const activeStation = activeMarker && 'name' in activeMarker.content ? activeMarker.content : null;
    const activeTitle = activeMarker && 'title' in activeMarker.content ? activeMarker.content.title : null;

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={12}
            onLoad={onMapLoad}
            onClick={() => setActiveMarker(null)}
            mapTypeId={mapTypeId}
            options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: mapTypeId === 'roadmap' ? mapThemeStyles : undefined,
                minZoom: 3,
            }}
        >
            {isLoaded && (
              <>
                {currentLocation && (
                  <MarkerF
                      position={currentLocation}
                      title="Your Location"
                      onMouseOver={() => setActiveMarker({ position: currentLocation, content: { title: 'Your Location' } })}
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
                        onMouseOver={() => setActiveMarker({ position: { lat: station.lat, lng: station.lng }, content: station })}
                        icon={getStationMarkerIcon(station)}
                        zIndex={requiredStationIds.includes(station.id) ? 2 : 1}
                    />
                ))}

                {activeMarker && (
                    <InfoWindowF
                        position={activeMarker.position}
                        onCloseClick={() => setActiveMarker(null)}
                        options={{ pixelOffset: new google.maps.Size(0, -30) }}
                    >
                       {activeStation ? (
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
                        ) : (
                           <div className="p-1 font-bold">{activeTitle}</div>
                        )}
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
                
                {originMarker && (
                    <MarkerF
                        position={originMarker.position}
                        title="Origin"
                        onMouseOver={() => setActiveMarker({ position: originMarker.position, content: { title: 'Origin' } })}
                        icon={originMarker.icon}
                    />
                )}

                {destinationMarker && (
                    <MarkerF
                        position={destinationMarker.position}
                        title="Destination"
                        onMouseOver={() => setActiveMarker({ position: destinationMarker.position, content: { title: 'Destination' } })}
                        icon={destinationMarker.icon}
                    />
                )}

                {showTraffic && <TrafficLayer autoUpdate />}
              </>
            )}
        </GoogleMap>
    );
}

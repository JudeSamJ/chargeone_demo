
"use client";

import type { Station } from '@/lib/types';
import { GoogleMap, Marker, useJsApiLoader, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { useState, useRef, useCallback, useEffect } from 'react';
import { findStations } from '@/ai/flows/findStations';
import { mapStyles } from '@/lib/map-styles';

interface MapViewProps {
    stations: Station[];
    selectedStation: Station | null;
    onStationSelect: (station: Station | null) => void;
    onStationsFound: (stations: Station[]) => void;
    route: google.maps.DirectionsResult | null;
}

const mapContainerStyle = {
  width: '100vw',
  height: '100vh',
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090
};

export default function MapView({ stations, selectedStation, onStationSelect, onStationsFound, route }: MapViewProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ['places'],
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const [center, setCenter] = useState(defaultCenter);

    const searchForStations = useCallback(async (location: { lat: number, lng: number }) => {
        // Do not search for nearby stations if a route is active
        if (route) return; 
        try {
            console.log("Searching for stations near:", location);
            const foundStations = await findStations({
                latitude: location.lat,
                longitude: location.lng,
                radius: 10000 // 10km
            });
            console.log("Found stations:", foundStations);
            onStationsFound(foundStations);
        } catch(e) {
            console.error("Error finding stations", e);
        }
    }, [onStationsFound, route]);


    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newCenter = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setCenter(newCenter);
                    map.panTo(newCenter);
                    searchForStations(newCenter);
                },
                () => {
                    // Geolocation failed, search at default location
                    searchForStations(defaultCenter);
                }
            );
        } else {
             // Geolocation not supported, search at default location
             searchForStations(defaultCenter);
        }
    }, [searchForStations]);

    useEffect(() => {
        if (route && mapRef.current) {
            const bounds = new google.maps.LatLngBounds();
            route.routes[0].legs.forEach(leg => {
                leg.steps.forEach(step => {
                    if (step.path) {
                        step.path.forEach(path => {
                            bounds.extend(path);
                        })
                    }
                })
            })
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
            {route && <DirectionsRenderer directions={route} options={{ suppressMarkers: true, polylineOptions: { strokeColor: 'hsl(var(--primary))', strokeWeight: 6 } }} />}

            {stations.map(station => (
                 <Marker
                    key={station.id}
                    position={{ lat: station.lat, lng: station.lng }}
                    onClick={() => onStationSelect(station)}
                    icon={{
                        url: station.isAvailable ? '/green-dot.png' : '/red-dot.png',
                        scaledSize: new window.google.maps.Size(15, 15),
                    }}
                />
            ))}

            {selectedStation && (
                <InfoWindow
                    position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
                    onCloseClick={() => onStationSelect(null)}
                >
                    <div className="p-2 max-w-xs">
                        <h4 className="font-bold text-md">{selectedStation.name}</h4>
                        <p className="text-sm text-muted-foreground">{selectedStation.location}</p>
                        <p className="text-sm mt-1">{selectedStation.power} kW</p>
                        <p className="text-sm font-semibold mt-2">₹{selectedStation.pricePerKwh.toFixed(2)} / kWh</p>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
}


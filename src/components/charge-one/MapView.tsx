
"use client";

import type { Station } from '@/lib/types';
import { GoogleMap, Marker, useJsApiLoader, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { useState, useRef, useCallback, useEffect } from 'react';
import { findStations } from '@/ai/flows/findStations';

interface MapViewProps {
    stations: Station[];
    selectedStation: Station | null;
    onStationSelect: (station: Station | null) => void;
    onStationsFound: (stations: Station[]) => void;
    route: google.maps.DirectionsResult | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '0.5rem',
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

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        // Optionally, get user's current location
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
                    // Handle error or user denial
                    searchForStations(defaultCenter);
                }
            );
        } else {
             searchForStations(defaultCenter);
        }
    }, []);

    const searchForStations = async (location: { lat: number, lng: number }) => {
        try {
            const foundStations = await findStations({
                latitude: location.lat,
                longitude: location.lng,
                radius: 10000 // 10km
            });
            onStationsFound(foundStations);
        } catch(e) {
            console.error("Error finding stations", e);
        }
    }

     useEffect(() => {
        if (route && mapRef.current) {
            const bounds = new google.maps.LatLngBounds();
            route.routes[0].legs.forEach(leg => {
                leg.steps.forEach(step => {
                    step.path.forEach(path => {
                        bounds.extend(path);
                    })
                })
            })
            mapRef.current.fitBounds(bounds);
        }
    }, [route]);


    if (loadError) return <div className="flex items-center justify-center h-[600px] bg-muted rounded-lg"><p>Error loading map</p></div>;
    if (!isLoaded) return <div className="flex items-center justify-center h-[600px] bg-muted rounded-lg"><p>Loading Map...</p></div>;

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={12}
            onLoad={onMapLoad}
            options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: mapStyles
            }}
        >
            {route && <DirectionsRenderer directions={route} options={{ suppressMarkers: true }} />}

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
                        <p className="text-sm mt-1">{selectedStation.distance.toFixed(1)} km away</p>
                        <p className="text-sm font-semibold mt-2">₹{selectedStation.pricePerKwh.toFixed(2)} / kWh</p>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
}

const mapStyles = [
    {
        "featureType": "all",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "weight": "2.00"
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#9c9c9c"
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.text",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "all",
        "stylers": [
            {
                "color": "#f2f2f2"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "landscape.man_made",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "all",
        "stylers": [
            {
                "saturation": -100
            },
            {
                "lightness": 45
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#eeeeee"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#7b7b7b"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "simplified"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "all",
        "stylers": [
            {
                "color": "#46bcec"
            },
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#c8d7d4"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#070707"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    }
];

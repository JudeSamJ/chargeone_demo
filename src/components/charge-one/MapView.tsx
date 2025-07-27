
"use client";

import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { mapStyles } from '@/lib/map-styles';
import { useCallback, useRef } from 'react';

const mapContainerStyle = {
  width: '100vw',
  height: '100vh',
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090
};

export default function MapView() {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ['places'],
    });

    const mapRef = useRef<google.maps.Map | null>(null);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);


    if (loadError) return <div className="flex items-center justify-center h-screen w-screen bg-muted rounded-lg"><p>Error loading map</p></div>;
    if (!isLoaded) return <div className="flex items-center justify-center h-screen w-screen bg-muted rounded-lg"><p>Loading Map...</p></div>;

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={12}
            onLoad={onMapLoad}
            options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: mapStyles,
            }}
        >
            {/* Markers and other elements will be added back here later */}
        </GoogleMap>
    );
}

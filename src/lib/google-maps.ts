
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const BASE_URL = "https://maps.googleapis.com/maps/api";

if (!API_KEY) {
    throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.");
}

export async function findPlace(options: { query: string, location: { lat: number, lng: number }, radius: number }) {
  const { query, location, radius } = options;
  const url = `${BASE_URL}/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&keyword=${encodeURIComponent(query)}&key=${API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    console.error('Google Places API Error:', data.error_message || data.status);
    return null;
  }
  
  return data.results;
}

export async function getPlaceDetails(placeId: string) {
    const url = `${BASE_URL}/place/details/json?place_id=${placeId}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
        console.error('Google Place Details API Error:', data.error_message || data.status);
        return null;
    }

    return data.result;
}

export async function getDirections(origin: string, destination: string) {
    const url = `${BASE_URL}/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
        console.error('Google Directions API Error:', data.error_message || data.status);
        return null;
    }

    return data;
}

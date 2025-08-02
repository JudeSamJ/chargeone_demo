
const API_KEY = "YOUR_API_KEY_HERE";

if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    // This check is now for the user to remember to replace the placeholder.
    console.warn("Please replace 'YOUR_API_KEY_HERE' in src/lib/google-maps.ts with your actual Google Maps API Key.");
}

export async function findPlace(options: { query: string, location: { lat: number, lng: number }, radius: number }) {
  const { query, location, radius } = options;
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&keyword=${encodeURIComponent(query)}&key=${API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    console.error('Google Places API Error:', data.error_message || data.status);
    return null;
  }
  
  return data.results;
}

export async function getPlaceDetails(placeId: string) {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
        console.error('Google Place Details API Error:', data.error_message || data.status);
        return null;
    }

    return data.result;
}

export async function getDirections(origin: string, destination: string) {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
        console.error('Google Directions API Error:', data.error_message || data.status);
        return null;
    }

    return data;
}

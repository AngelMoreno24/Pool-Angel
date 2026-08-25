// Geocodes an address into { latitude, longitude } using Nominatim, OSM's
// free geocoding service. No API key needed, but their usage policy
// requires: max 1 request/sec, and a real identifying User-Agent - both
// satisfied here since this only runs once per property, at creation time,
// and the result is cached in the DB rather than re-geocoded on every load.
export const geocodeAddress = async (address, city, state, zip) => {
  const query = [address, city, state, zip].filter(Boolean).join(", ");
  if (!query) return null;
 
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        // Replace with your actual app name/contact - Nominatim requires
        // a real identifying User-Agent, not the default fetch one.
        "User-Agent": "PoolServiceApp/1.0 (https://am-pool-angel.netlify.app/)",
      },
    });
 
    if (!response.ok) {
      console.error("Geocoding request failed:", response.status);
      return null;
    }
 
    const results = await response.json();
    if (!results?.[0]) return null;
 
    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
    };
  } catch (error) {
    // Geocoding failure should never block creating the property - it just
    // means this one won't show on the map until re-geocoded.
    console.error("Geocoding error:", error);
    return null;
  }
};

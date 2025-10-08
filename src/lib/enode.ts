// This service file now calls our internal proxy API route,
// which securely communicates with the Enode API.

const API_BASE_URL = '/api/enode';

interface EnodeBrand {
    id: string;
    name: string;
}

interface EnodeModel {
    id: string;
    name: string;
    batteryCapacity: number;
    supportedChargers: string[];
}


/**
 * Fetches the list of supported vehicle brands from our secure Enode proxy.
 * @returns A promise that resolves to an array of vehicle brands.
 */
export async function getVehicleBrands(): Promise<EnodeBrand[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/brands`);
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || 'Failed to fetch vehicle brands');
        }
        const data = await response.json();
        // Assuming the proxy returns the data in a `data` field
        return data.data;
    } catch (error) {
        console.error("Enode Service Error (getVehicleBrands):", error);
        throw error;
    }
}

/**
 * Fetches the list of models for a specific brand from our secure Enode proxy.
 * @param brandId The ID of the brand (e.g., 'tesla').
 * @returns A promise that resolves to an array of vehicle models for that brand.
 */
export async function getVehicleModels(brandId: string): Promise<EnodeModel[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/models?brand=${brandId}`);
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || `Failed to fetch models for brand ${brandId}`);
        }
        const data = await response.json();

        // The Enode API for models might return a more complex object.
        // We'll map it to the structure our app expects.
        return data.data.map((model: any) => ({
            id: model.id,
            name: model.name,
            batteryCapacity: model.battery.capacity,
            supportedChargers: model.charging.supportedChargers.map((charger: string) => charger.replace(/_/g, '-').toUpperCase()),
        }));

    } catch (error) {
        console.error(`Enode Service Error (getVehicleModels for ${brandId}):`, error);
        throw error;
    }
}

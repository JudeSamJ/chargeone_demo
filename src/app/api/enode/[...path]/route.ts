import { NextRequest, NextResponse } from 'next/server';
import NodeCache from 'node-cache';

const enodeApiBaseUrl = 'https://enode-api.sandbox.enode.io';
const clientId = process.env.ENODE_CLIENT_ID;
const clientSecret = process.env.ENODE_CLIENT_SECRET;

// Simple in-memory cache for the access token with a TTL (Time To Live)
// The token from Enode lasts for 1 hour (3600 seconds), so we'll set our cache to slightly less.
const tokenCache = new NodeCache({ stdTTL: 3500 });
const TOKEN_CACHE_KEY = 'enode_access_token';

/**
 * Retrieves a valid access token from Enode, using a cache to avoid re-authentication.
 */
async function getAccessToken(): Promise<string> {
    if (!clientId || !clientSecret) {
        throw new Error('Enode client ID or secret is not configured in environment variables.');
    }

    // Try to get the token from the cache first
    const cachedToken = tokenCache.get<string>(TOKEN_CACHE_KEY);
    if (cachedToken) {
        return cachedToken;
    }

    // If not in cache, fetch a new one
    const tokenUrl = `${enodeApiBaseUrl}/oauth2/token`;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to get Enode access token:", response.status, errorBody);
        throw new Error('Could not authenticate with Enode API.');
    }

    const data = await response.json();
    const accessToken = data.access_token;

    // Store the new token in the cache
    tokenCache.set(TOKEN_CACHE_KEY, accessToken);

    return accessToken;
}

/**
 * Generic handler for all /api/enode/* requests.
 * It proxies requests to the Enode API, adding the necessary authentication.
 */
async function handler(req: NextRequest) {
    // Extract the path from the request URL, e.g., 'brands' or 'models'
    const path = req.nextUrl.pathname.replace('/api/enode/', '');
    const searchParams = req.nextUrl.search; // Pass along any query parameters

    try {
        const accessToken = await getAccessToken();

        const enodeUrl = `${enodeApiBaseUrl}/v1/${path}${searchParams}`;

        const enodeResponse = await fetch(enodeUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!enodeResponse.ok) {
            const errorBody = await enodeResponse.json();
            return NextResponse.json(
                { error: errorBody.error_description || 'Enode API error' },
                { status: enodeResponse.status }
            );
        }

        const data = await enodeResponse.json();
        
        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// We export the handler for both GET and POST for flexibility, though we only use GET for now.
export { handler as GET, handler as POST };


import { NextRequest, NextResponse } from 'next/server';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

// Define the structure of the API request body
interface ChargingRequestBody {
  provider: string;
  action: 'startSession' | 'stopSession' | 'getSessionStatus' | 'listActiveSessions';
  params: Record<string, any>;
}

// Load and parse the YAML configuration file
// This is done once when the server starts
const configPath = path.join(process.cwd(), 'charging-providers.yaml');
const configFile = fs.readFileSync(configPath, 'utf8');
const config = yaml.load(configFile) as any;

/**
 * Maps our internal parameter keys to the keys expected by the provider's API.
 * @param params - The parameters from our application's request.
 * @param mapping - The parameter mapping configuration for the endpoint.
 * @returns An object with keys mapped to the provider's expected format.
 */
function mapRequestParams(params: Record<string, any>, mapping: Record<string, string>): Record<string, any> {
  const mappedParams: Record<string, any> = {};
  for (const key in params) {
    if (mapping[key]) {
      mappedParams[mapping[key]] = params[key];
    }
  }
  return mappedParams;
}

/**
 * This is the main handler for all charging-related API calls.
 * It acts as a universal adapter for different EV charging networks.
 */
export async function POST(req: NextRequest) {
  try {
    const body: ChargingRequestBody = await req.json();
    const { provider, action, params } = body;

    // 1. Get the configuration for the requested provider
    const providerConfig = config.providers[provider];
    if (!providerConfig) {
      return NextResponse.json({ error: `Provider '${provider}' not configured.` }, { status: 400 });
    }

    // 2. Get the specific endpoint configuration for the action
    const endpointConfig = providerConfig.endpoints[action];
    if (!endpointConfig) {
      return NextResponse.json({ error: `Action '${action}' not supported for provider '${provider}'.` }, { status: 400 });
    }

    // 3. Prepare the request for the external API
    let requestUrl = `${providerConfig.baseUrl}${endpointConfig.path}`;
    
    // Replace path variables like {sessionId}
    Object.keys(params).forEach(key => {
        if (requestUrl.includes(`{${key}}`)) {
            requestUrl = requestUrl.replace(`{${key}}`, params[key]);
        }
    });

    // 4. Handle authentication
    const apiKey = process.env[providerConfig.authentication.secretName];
    if (!apiKey) {
        return NextResponse.json({ error: `API key for ${provider} is not configured.` }, { status: 500 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (providerConfig.authentication.type === 'apiKey') {
        headers['X-API-Key'] = apiKey;
    } else if (providerConfig.authentication.type === 'bearerToken') {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // 5. Map parameters and construct the request body/query string
    const requestOptions: RequestInit = {
      method: endpointConfig.method,
      headers,
    };

    if (endpointConfig.method === 'POST') {
      requestOptions.body = JSON.stringify(mapRequestParams(params, endpointConfig.paramMapping));
    } else if (endpointConfig.method === 'GET') {
      const queryParams = new URLSearchParams(mapRequestParams(params, endpointConfig.paramMapping));
      if (queryParams.toString()) {
        requestUrl += `?${queryParams.toString()}`;
      }
    }
    
    // **MOCK RESPONSE**
    // In a real application, you would make the actual fetch request:
    // const response = await fetch(requestUrl, requestOptions);
    // const data = await response.json();
    // if (!response.ok) {
    //   return NextResponse.json({ error: 'Provider API error', details: data }, { status: response.status });
    // }
    // For this demonstration, we'll return a mock success response.
    
    console.log(`[MOCK] Making ${requestOptions.method} request to ${requestUrl}`);
    console.log('[MOCK] With headers:', headers);
    if(requestOptions.body) console.log('[MOCK] With body:', requestOptions.body);

    const mockResponse = {
      success: true,
      action,
      provider,
      // You can add mock data based on the action here
      data: {
        sessionId: `mock_session_${Date.now()}`,
        status: action === 'startSession' ? 'charging' : 'completed',
        message: `Successfully executed '${action}' on provider '${provider}'.`
      }
    };

    return NextResponse.json(mockResponse, { status: 200 });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

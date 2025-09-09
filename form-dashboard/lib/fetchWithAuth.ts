import { cookies } from 'next/headers';

// This is a server-side fetch wrapper.

async function refreshToken(): Promise<string> {
  // We need to construct the full URL to fetch from a server component
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/refresh`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
        // Pass cookies from the incoming request to the API route
        'Cookie': cookies().toString(), 
    }
  });

  if (!response.ok) {
    // Handle logout process in case of failure
    console.error("Failed to refresh token");
    throw new Error('Failed to refresh token');
  }
  
  const data = await response.json();
  if (!data.access_token) {
    console.error("New access token not found in refresh response");
    throw new Error('New access token not found in refresh response');
  }

  return data.access_token;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const cookieStore = cookies();
  let accessToken = cookieStore.get('access_token')?.value;

  // Initial request
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  // If token expired, refresh and retry
  if (response.status === 401) {
    console.log("Access token expired. Refreshing...");
    const newAccessToken = await refreshToken();

    // Retry the request with the new token
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${newAccessToken}`,
      },
    });
  }

  return response;
}

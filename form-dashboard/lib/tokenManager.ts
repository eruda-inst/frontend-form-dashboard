function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

function setCookie(name: string, value: string) {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${name}=${value}; path=/`;
}

function isTokenExpiring(token: string, thresholdMs = 10 * 60 * 1000) {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const decoded = JSON.parse(decodedJson);
    const exp = decoded.exp * 1000;
    const timeRemaining = exp - Date.now();
    return timeRemaining <= thresholdMs;
  } catch (error) {
    console.error('[TokenManager] Failed to decode token', error);
    return true;
  }
}

export async function refreshAccessTokenIfNeeded() {
  const refreshToken = getCookie('refresh_token');
  let accessToken = getCookie('access_token');

  if (!refreshToken) {
    console.log('[TokenManager] No refresh token available.');
    return;
  }

  if (!accessToken || isTokenExpiring(accessToken)) {
    console.log('[TokenManager] Access token missing or expiring. Refreshing...');
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        console.error('[TokenManager] Failed to refresh token:', response.status);
        return;
      }

      const data = await response.json();
      if (!data.access_token) {
        console.error('[TokenManager] No access token in refresh response');
        return;
      }

      accessToken = data.access_token;
      setCookie('access_token', accessToken);
      console.log('[TokenManager] Token refreshed successfully.');
    } catch (error) {
      console.error('[TokenManager] Error refreshing token:', error);
    }
  }
}

export { getCookie };

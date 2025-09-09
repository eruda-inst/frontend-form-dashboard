// lib/clientFetchWithAuth.ts

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; url: string; options: RequestInit; }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      // We don't have the token directly, so we just retry the original call
      // which will then use the new token from the cookie.
      prom.resolve(clientFetchWithAuth(prom.url, prom.options));
    }
  });
  failedQueue = [];
};

export async function clientFetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let accessToken = getCookie('access_token');

  const finalOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
    },
  };

  if (accessToken) {
    (finalOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, finalOptions);

  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, url, options });
      })
      .then(res => res as Response)
      .catch(err => { throw err; });
    }

    isRefreshing = true;

    try {
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
      });

      if (!refreshResponse.ok) {
        // Refresh failed, logout user
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        const error = new Error("Failed to refresh token");
        processQueue(error, null);
        isRefreshing = false;
        return Promise.reject(error);
      }
      
      // The cookie is automatically updated by the API route.
      const newAccessToken = getCookie('access_token');
      processQueue(null, newAccessToken);
      isRefreshing = false;
      
      // Retry the original request with new token
      const newFinalOptions: RequestInit = {
        ...options,
        headers: {
          ...options.headers,
        },
      };
      if (newAccessToken) {
        (newFinalOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
      }
      return await fetch(url, newFinalOptions);

    } catch (error) {
      processQueue(error, null);
      isRefreshing = false;
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  }

  return response;
}

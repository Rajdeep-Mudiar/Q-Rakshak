import { API_KEY, API_TIMEOUT_MS } from "./config";

let authExpiredDebounceTimer = null;
function notifyAuthExpired(endpoint) {
  localStorage.removeItem("qmed_token");
  localStorage.removeItem("qmed_user");
  if (!authExpiredDebounceTimer) {
    window.dispatchEvent(new CustomEvent("qmed:auth_expired", { detail: { endpoint } }));
    authExpiredDebounceTimer = setTimeout(() => {
      authExpiredDebounceTimer = null;
    }, 2000);
  }
}

async function executeFetchWithRetry(endpoint, fetchOptions, timeoutId, maxRetries = 3) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await fetch(endpoint, fetchOptions);
      if (timeoutId) clearTimeout(timeoutId);

      const isAuthEndpoint = endpoint.includes("/auth/login") || endpoint.includes("/auth/register");
      if (response.status === 401 && !isAuthEndpoint) {
        notifyAuthExpired(endpoint);
      }

      // Check for cloud free-tier cold-start gateway errors (502, 503, 504)
      const isColdStartError = [502, 503, 504].includes(response.status);
      if (isColdStartError && attempt < maxRetries) {
        attempt++;
        const backoffMs = Math.min(attempt * 1200, 4000);
        console.warn(`[Cold Start Notice] Server gateway responding with ${response.status}. Retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})...`);
        window.dispatchEvent(new CustomEvent("qmed:cold_start_retry", { detail: { attempt, maxRetries, backoffMs } }));
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || `API Error (${response.status})`;
        const err = new Error(errorMessage);
        err.status = response.status;
        err.data = errorData;
        throw err;
      }

      return await response.json();
    } catch (error) {
      attempt++;
      // Retry on network failures (Failed to fetch, network dropped)
      const isGet = !fetchOptions.method || fetchOptions.method === "GET";
      const isNetworkError = error.message === "Failed to fetch" || error.name === "TypeError";
      const isAuthEndpoint = endpoint.includes("/auth/login") || endpoint.includes("/auth/register");

      if (attempt <= maxRetries && (isGet || isAuthEndpoint) && isNetworkError) {
        const delayMs = Math.min(attempt * 1000, 3000);
        console.warn(`[Connection Retry] Network connection re-attempt ${attempt}/${maxRetries} to ${endpoint} in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      if (timeoutId) clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error(`API request timed out: ${endpoint}`);
      }
      if (isNetworkError) {
        console.warn(`[Network/CORS Notice] Failed to connect to ${endpoint}. Verify server status and CORS origin.`);
      }
      throw error;
    }
  }
}

export async function request(endpoint, options = {}) {
  const isAuthEndpoint = endpoint.includes("/auth/login") || endpoint.includes("/auth/register");
  const token = isAuthEndpoint ? null : localStorage.getItem("qmed_token");
  const storedApiKey = localStorage.getItem("qmed_api_key");
  const effectiveApiKey = storedApiKey || API_KEY;

  // No timer / no abort timeout when timeout is 0 or disabled (supports Render free-tier cold starts)
  const timeoutMs = options.timeout !== undefined ? options.timeout : API_TIMEOUT_MS;
  const controller = new AbortController();
  let timeoutId = null;
  if (timeoutMs && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  const headers = {
    Accept: "application/json",
    ...(effectiveApiKey ? { "X-API-Key": effectiveApiKey } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions = {
    ...options,
    headers,
    signal: controller.signal,
    mode: "cors",
  };

  return executeFetchWithRetry(endpoint, fetchOptions, timeoutId);
}

export const apiClient = {
  get: (endpoint, headers, options = {}) => request(endpoint, { method: "GET", headers, ...options }),
  post: (endpoint, body, headers, options = {}) =>
    request(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
      ...options,
    }),
  put: (endpoint, body, headers, options = {}) =>
    request(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
      ...options,
    }),
  delete: (endpoint, headers, options = {}) => request(endpoint, { method: "DELETE", headers, ...options }),
};

export default apiClient;

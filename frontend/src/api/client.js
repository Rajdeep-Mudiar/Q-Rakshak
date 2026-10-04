import { API_KEY, API_TIMEOUT_MS } from "./config";

let authExpiredDebounceTimer = null;
function notifyAuthExpired(endpoint) {
  const token = localStorage.getItem("qmed_token");
  if (!token) return;
  localStorage.removeItem("qmed_token");
  localStorage.removeItem("qmed_user");
  if (!authExpiredDebounceTimer) {
    window.dispatchEvent(new CustomEvent("qmed:auth_expired", { detail: { endpoint } }));
    authExpiredDebounceTimer = setTimeout(() => {
      authExpiredDebounceTimer = null;
    }, 2000);
  }
}

const inFlightGets = new Map();

let activeHostOverride = null;

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    window.dispatchEvent(
      new CustomEvent("qmed:connectivity_status", {
        detail: { status: "online", message: "Internet connection restored." },
      })
    );
  });
  window.addEventListener("offline", () => {
    window.dispatchEvent(
      new CustomEvent("qmed:connectivity_status", {
        detail: { status: "offline", message: "Network connection lost. Operating in offline mode." },
      })
    );
  });
}

function resolveTargetUrl(endpoint) {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  if (activeHostOverride && endpoint.startsWith("/")) {
    return `${activeHostOverride}${endpoint}`;
  }
  return endpoint;
}

async function executeFetchWithRetry(endpoint, fetchOptions, timeoutId, maxRetries = 2) {
  let attempt = 0;
  let targetUrl = resolveTargetUrl(endpoint);

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(targetUrl, fetchOptions);
      if (timeoutId) clearTimeout(timeoutId);

      const isAuthEndpoint =
        targetUrl.includes("/auth/login") ||
        targetUrl.includes("/auth/register") ||
        targetUrl.includes("/auth/google") ||
        targetUrl.includes("/auth/me");
      if (response.status === 401 && !isAuthEndpoint) {
        notifyAuthExpired(targetUrl);
      }

      // Check for cloud free-tier cold-start gateway errors (502, 503, 504)
      const isColdStartError = [502, 503, 504].includes(response.status);
      if (isColdStartError && attempt < maxRetries) {
        attempt++;
        const backoffMs = Math.min(attempt * 1500, 5000);
        console.warn(`[Cold Start Notice] Server gateway responding with ${response.status}. Retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})...`);
        window.dispatchEvent(new CustomEvent("qmed:cold_start_retry", { detail: { attempt, maxRetries, backoffMs } }));
        window.dispatchEvent(
          new CustomEvent("qmed:connectivity_status", {
            detail: {
              status: "cold_start",
              attempt,
              maxRetries,
              message: `Clinical gateway warming up (attempt ${attempt}/${maxRetries})...`,
            },
          })
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json") || contentType.includes("application/problem+json");

      if (!response.ok) {
        let errorData = {};
        if (isJson) {
          errorData = await response.json().catch(() => ({}));
        } else {
          const rawText = await response.text().catch(() => "");
          errorData = { detail: rawText.slice(0, 200) || `HTTP error ${response.status}` };
        }
        const errorMessage = errorData.detail || errorData.message || `API Error (${response.status})`;
        const err = new Error(errorMessage);
        err.status = response.status;
        err.data = errorData;
        throw err;
      }

      // Successful 2xx response
      if (isJson) {
        return await response.json();
      }

      // If text or HTML returned (e.g. static site SPA fallback returning HTML instead of JSON)
      const rawText = await response.text();
      if (rawText.trim().startsWith("<!DOCTYPE") || rawText.trim().startsWith("<html")) {
        // If we hit HTML fallback on localhost preview, try fallback directly to port 8000
        if (
          !activeHostOverride &&
          typeof window !== "undefined" &&
          (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
          window.location.port !== "8000" &&
          endpoint.startsWith("/")
        ) {
          activeHostOverride = "http://127.0.0.1:8000";
          targetUrl = resolveTargetUrl(endpoint);
          console.info(`[Direct Fallback] Re-routing API request to direct local backend: ${targetUrl}`);
          continue;
        }

        const err = new Error(`Endpoint '${targetUrl}' returned HTML instead of JSON. Ensure backend API is accessible.`);
        err.status = 404;
        err.isHtmlFallback = true;
        throw err;
      }

      try {
        return JSON.parse(rawText);
      } catch {
        return rawText;
      }
    } catch (error) {
      // Direct localhost fallback on network connection failure
      if (
        !activeHostOverride &&
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
        window.location.port !== "8000" &&
        endpoint.startsWith("/") &&
        (error.message === "Failed to fetch" || error.name === "TypeError")
      ) {
        activeHostOverride = "http://127.0.0.1:8000";
        targetUrl = resolveTargetUrl(endpoint);
        console.info(`[Direct Fallback] Retrying via direct local backend: ${targetUrl}`);
        continue;
      }

      // Never retry on client errors, auth expired, or HTML fallback from static rewrite
      if (error.status && error.status < 500) {
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }

      attempt++;
      const isGet = !fetchOptions.method || fetchOptions.method === "GET";
      const isNetworkError = error.message === "Failed to fetch" || error.name === "TypeError";
      const isAuthEndpoint = targetUrl.includes("/auth/login") || targetUrl.includes("/auth/register");

      if (attempt <= maxRetries && (isGet || isAuthEndpoint) && isNetworkError) {
        const delayMs = Math.min(attempt * 1200, 3500);
        console.warn(`[Connection Retry] Network re-attempt ${attempt}/${maxRetries} to ${targetUrl} in ${delayMs}ms...`);
        window.dispatchEvent(
          new CustomEvent("qmed:connectivity_status", {
            detail: {
              status: "retrying",
              attempt,
              maxRetries,
              message: `Re-establishing clinical connection (${attempt}/${maxRetries})...`,
            },
          })
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      if (timeoutId) clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error(`API request timed out: ${targetUrl}`);
      }
      if (isNetworkError) {
        console.warn(`[Network/CORS Notice] Failed to connect to ${targetUrl}. Verify server status and CORS origin.`);
        window.dispatchEvent(
          new CustomEvent("qmed:connectivity_status", {
            detail: {
              status: "offline",
              message: "Clinical Gateway unreachable. Operating with cached clinical models.",
            },
          })
        );
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
    ...(token ? { Authorization: `Bearer ${token}` } : (effectiveApiKey ? { "X-API-Key": effectiveApiKey } : {})),
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

  const isGet = !options.method || options.method === "GET";
  if (isGet && !options.noDedupe) {
    const dedupeKey = `${endpoint}:${token || ""}`;
    if (inFlightGets.has(dedupeKey)) {
      return inFlightGets.get(dedupeKey);
    }
    const promise = executeFetchWithRetry(endpoint, fetchOptions, timeoutId).finally(() => {
      inFlightGets.delete(dedupeKey);
    });
    inFlightGets.set(dedupeKey, promise);
    return promise;
  }

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

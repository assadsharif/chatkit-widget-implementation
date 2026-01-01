/**
 * HTTP Utilities - Phase 13A: Request Tracing
 *
 * Provides request ID generation and header injection for all HTTP requests.
 *
 * Objective: Correlate frontend actions with backend logs using X-Request-ID.
 */

/**
 * Generate a unique request ID for tracing.
 *
 * Uses crypto.randomUUID() for standard UUID v4 generation.
 *
 * @returns {string} UUID v4 request ID
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Add request ID header to fetch options.
 *
 * Phase 13A: Ensures every backend request has X-Request-ID for correlation.
 *
 * @param {RequestInit} options - Existing fetch options (optional)
 * @param {string} requestId - Request ID to inject (optional, auto-generated if not provided)
 * @returns {RequestInit} Fetch options with X-Request-ID header
 *
 * @example
 * const options = addRequestIdHeader({ method: 'POST', body: JSON.stringify(data) });
 * fetch('/api/chat', options);
 */
export function addRequestIdHeader(
  options: RequestInit = {},
  requestId?: string
): RequestInit {
  const id = requestId || generateRequestId();

  return {
    ...options,
    headers: {
      ...options.headers,
      'X-Request-ID': id,
    },
  };
}

/**
 * Enhanced fetch with automatic request ID injection.
 *
 * Phase 13A: Wrapper around native fetch() that automatically adds X-Request-ID.
 *
 * @param {RequestInfo | URL} input - Request URL
 * @param {RequestInit} init - Fetch options (optional)
 * @returns {Promise<Response>} Fetch response
 *
 * @example
 * // Automatic request ID
 * const response = await fetchWithRequestId('/api/chat', { method: 'POST', body: data });
 *
 * // Manual request ID (for correlation)
 * const requestId = generateRequestId();
 * console.log('Sending request:', requestId);
 * const response = await fetchWithRequestId('/api/chat', { method: 'POST', body: data }, requestId);
 */
export async function fetchWithRequestId(
  input: RequestInfo | URL,
  init?: RequestInit,
  requestId?: string
): Promise<Response> {
  const options = addRequestIdHeader(init, requestId);
  return fetch(input, options);
}

/**
 * Extract request ID from response headers.
 *
 * Phase 13A: Backend echoes X-Request-ID in response - extract for logging.
 *
 * @param {Response} response - Fetch response
 * @returns {string | null} Request ID from response, or null if not present
 *
 * @example
 * const response = await fetchWithRequestId('/api/chat', options);
 * const requestId = getRequestIdFromResponse(response);
 * console.log('Backend processed request:', requestId);
 */
export function getRequestIdFromResponse(response: Response): string | null {
  return response.headers.get('X-Request-ID');
}

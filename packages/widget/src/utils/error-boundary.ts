/**
 * Error Boundary Utilities - Phase 13C
 *
 * Frontend error handling with user-safe messaging and request ID tracking.
 *
 * Objective: Failures are explicit, isolated, and user-safe.
 */

/**
 * Handle fetch errors with user-friendly messages.
 *
 * Phase 13C: Extract request ID from response for support/debugging.
 *
 * @param {Response} response - Fetch response object
 * @returns {Promise<{message: string, requestId?: string}>} User-safe error info
 */
export async function handleFetchError(response: Response): Promise<{
  message: string;
  requestId?: string;
}> {
  // Extract request ID from response headers (backend echoes it)
  const requestId = response.headers.get('X-Request-ID') || undefined;

  // Try to parse error response
  try {
    const errorData = await response.json();

    // Backend error with structured format
    if (errorData.error) {
      return {
        message: errorData.message || 'An error occurred',
        requestId: errorData.request_id || requestId,
      };
    }
  } catch {
    // Response wasn't JSON - use generic message
  }

  // Fallback error messages based on status code
  const statusMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Authentication required. Please log in.',
    403: 'Access denied.',
    404: 'Resource not found.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    503: 'Service unavailable. Please try again later.',
  };

  return {
    message: statusMessages[response.status] || `Error (${response.status})`,
    requestId,
  };
}

/**
 * Show user-friendly error UI with optional request ID.
 *
 * Phase 13C: Display request ID for support tickets.
 *
 * @param {string} message - User-safe error message
 * @param {string} requestId - Request ID for correlation (optional)
 * @returns {string} HTML string for error UI
 */
export function createErrorUI(message: string, requestId?: string): string {
  return `
    <style>
      .chatkit-error {
        padding: 16px;
        background: #fee;
        border-left: 4px solid #c00;
        border-radius: 4px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 12px 0;
      }
      .chatkit-error-message {
        color: #c00;
        font-size: 14px;
        font-weight: 500;
        margin: 0 0 8px 0;
      }
      .chatkit-error-request-id {
        color: #666;
        font-size: 12px;
        font-family: 'Courier New', monospace;
        margin: 0;
      }
      .chatkit-error-request-id-label {
        font-weight: 600;
      }
    </style>
    <div class="chatkit-error">
      <p class="chatkit-error-message">${message}</p>
      ${
        requestId
          ? `<p class="chatkit-error-request-id">
               <span class="chatkit-error-request-id-label">Reference ID:</span> ${requestId}
             </p>`
          : ''
      }
    </div>
  `;
}

/**
 * Network error handler (no response).
 *
 * Phase 13C: Handle cases where fetch fails completely.
 *
 * @param {Error} error - Network error
 * @returns {{message: string}} User-safe error info
 */
export function handleNetworkError(error: Error): { message: string } {
  console.error('Network error:', error);

  return {
    message: 'Network error. Please check your connection and try again.',
  };
}

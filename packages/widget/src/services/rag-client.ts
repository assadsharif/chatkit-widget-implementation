/**
 * RAG Client Service
 *
 * Handles communication with FastAPI backend.
 * Isolated from UI - pure data layer.
 *
 * Phase 7B-3: Fetch adapter (NOT connected to widget yet)
 * Phase 13A: Request ID tracing for correlation
 *
 * Contract: specs/phase-7b/rag-api.contract.md
 */

import { fetchWithRequestId, getRequestIdFromResponse } from '../utils/http.js';

// Request types (from contract)
export interface RAGContext {
  mode: 'browse' | 'chat';
  selected_text?: string;
  page_url?: string;
  session_id: string;
}

export interface RAGRequest {
  message: string;
  context: RAGContext;
  tier: 'anonymous' | 'lightweight' | 'full' | 'premium';
}

// Response types (from contract)
export interface RAGSource {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  score: number;
}

export interface RAGMetadata {
  model: string;
  tokens_used: number;
  retrieval_time_ms: number;
  generation_time_ms: number;
  total_time_ms: number;
}

export interface RAGResponse {
  answer: string;
  sources: RAGSource[];
  metadata: RAGMetadata;
}

// Error types (from contract)
export interface RAGError {
  code: string;
  message: string;
  details?: any;
}

export class RAGClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'RAGClientError';
  }
}

/**
 * RAG Client
 *
 * Isolated fetch adapter for backend communication.
 * Zero UI logic - widget handles rendering.
 */
export class RAGClient {
  private baseURL: string;
  private abortController: AbortController | null = null;
  private timeout: number;

  constructor(baseURL: string = 'http://localhost:8000', timeout: number = 30000) {
    this.baseURL = baseURL;
    this.timeout = timeout; // Default 30s timeout
  }

  /**
   * Send message to RAG backend
   *
   * @param request - RAG request matching contract
   * @returns Promise<RAGResponse>
   * @throws RAGClientError on validation or network errors
   */
  async sendMessage(request: RAGRequest): Promise<RAGResponse> {
    // Validate request (client-side validation from contract)
    this.validateRequest(request);

    // Create AbortController for cancellation
    this.abortController = new AbortController();

    // Set timeout to abort request
    const timeoutId = setTimeout(() => {
      if (this.abortController) {
        this.abortController.abort();
      }
    }, this.timeout);

    try {
      // Phase 13A: Use fetchWithRequestId for automatic request ID injection
      const response = await fetchWithRequestId(`${this.baseURL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: this.abortController.signal,
      });

      // Clear timeout on success
      clearTimeout(timeoutId);

      // Phase 13A: Log request ID for correlation (optional)
      const requestId = getRequestIdFromResponse(response);
      if (requestId) {
        console.debug('RAG request completed:', requestId);
      }

      // Handle HTTP errors
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Parse success response
      const data: RAGResponse = await response.json();
      return data;
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId);

      // Handle network errors
      if (error instanceof RAGClientError) {
        throw error; // Re-throw RAGClientError
      }

      if ((error as any).name === 'AbortError') {
        throw new RAGClientError(
          'REQUEST_TIMEOUT',
          'Request timed out. Please try again.'
        );
      }

      throw new RAGClientError(
        'NETWORK_ERROR',
        'Failed to connect to RAG service',
        { originalError: error }
      );
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancel ongoing request
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Client-side validation (from contract rules)
   */
  private validateRequest(request: RAGRequest): void {
    // Message validation
    const trimmedMessage = request.message.trim();
    if (trimmedMessage.length === 0) {
      throw new RAGClientError('INVALID_REQUEST', 'Message cannot be empty');
    }
    if (trimmedMessage.length > 2000) {
      throw new RAGClientError(
        'MESSAGE_TOO_LONG',
        'Message must be 2000 characters or less'
      );
    }

    // Selected text validation
    if (request.context.selected_text && request.context.selected_text.length > 5000) {
      throw new RAGClientError(
        'SELECTED_TEXT_TOO_LONG',
        'Selected text must be 5000 characters or less'
      );
    }

    // Session ID validation (basic UUID check)
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(request.context.session_id)) {
      throw new RAGClientError('INVALID_SESSION_ID', 'Session ID must be a valid UUID v4');
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: { error: RAGError };

    try {
      errorData = await response.json();
    } catch {
      // Fallback if response is not JSON
      throw new RAGClientError(
        'UNKNOWN_ERROR',
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const error = errorData.error;

    throw new RAGClientError(error.code, error.message, error.details);
  }
}

